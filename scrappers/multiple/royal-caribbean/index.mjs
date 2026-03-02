import puppeteer from "puppeteer";
import fs from "fs";

const OUTPUT_FILE = "./data.json";

function appendToFile(newData) {
    let fileData = {
        totalCruises: 0,
        scrapedAt: null,
        cruises: []
    };

    // If file exists, read old structured data
    if (fs.existsSync(OUTPUT_FILE)) {
        const fileContent = fs.readFileSync(OUTPUT_FILE, "utf-8");
        if (fileContent) {
            fileData = JSON.parse(fileContent);
        }
    }

    // Append new records
    fileData.cruises = [...fileData.cruises, ...newData];

    // Update metadata
    fileData.totalCruises = fileData.cruises.length;
    fileData.scrapedAt = new Date().toISOString();

    // Save back
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileData, null, 2));

    console.log(`💾 Saved ${newData.length} records. Total: ${fileData.totalCruises}`);
}

async function scrape_royal() {
    console.log("Opening Royal Caribbean cruises...");

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
        );

        await page.goto(
            "https://www.royalcaribbean.com/cruises?country=USA",
            { waitUntil: "networkidle2", timeout: 0 }
        );

        await page.waitForSelector("div[id^='cruise-results-wrapper']", {
            timeout: 60000
        });

        console.log("✅ Page loaded");

        let savedCount = 0;

        while (true) {
            const cruises = await page.$$eval("[data-testid^='cruise-card-']", cards =>
                cards.map(card => {
                    const title =
                        card.querySelector('[data-testid^="cruise-name-label"]')?.innerText.trim() || null;

                    const duration =
                        card.querySelector('[data-testid^="cruise-duration-label"]')?.innerText.trim() || null;

                    const ship =
                        card.querySelector('[data-testid^="cruise-ship-label"]')?.innerText.trim() || null;

                    const startDate = card.getAttribute("data-start-date") || null;
                    const endDate = card.getAttribute("data-end-date") || null;

                    const priceNode = card.querySelector('[data-testid^="cruise-price-label"]');
                    const price = priceNode
                        ? priceNode.innerText
                            .replace(/\n/g, "")      // remove new lines
                            .replace(/\s+/g, "")     // remove extra spaces
                            .replace(/^\$+/, "$")    // ensure only one $
                        : null;

                    const ports = Array.from(
                        card.querySelectorAll('[data-testid^="cruise-ports-label"] li')
                    ).map(li => li.textContent.trim());

                    const linkPart = card.getAttribute("data-product-view-link");
                    const link = linkPart ? `https://www.royalcaribbean.com/${linkPart}` : null;

                    const image = card.querySelector("img")?.src || null;

                    return {
                        title: ports.length ? `${ports[0]} to ${ports[ports.length - 1]}` : title,
                        ship: ship ? [ship] : [],
                        startDate,
                        endDate,
                        duration: duration ? duration : null,
                        price,
                        link,
                        image,
                        provider: "ROYAL_CARIBBEAN"
                    };
                })
            );

            // Get only new records (unsaved ones)
            const newRecords = cruises.slice(savedCount, savedCount + 10);

            if (newRecords.length > 0) {
                appendToFile(newRecords);
                savedCount += newRecords.length;
            }

            // Try clicking Load More
            const loadMoreSelector = 'button[data-testid="load-more-button"]';
            const btn = await page.$(loadMoreSelector);

            if (!btn) {
                console.log("🛑 No more Load More button");
                break;
            }

            await btn.evaluate(b => b.scrollIntoView({ behavior: "auto", block: "center" }));
            await btn.click();

            try {
                await page.waitForFunction(
                    (selector, oldCount) =>
                        document.querySelectorAll(selector).length > oldCount,
                    { timeout: 20000 },
                    "[data-testid^='cruise-card-']",
                    cruises.length
                );
            } catch {
                console.log("🛑 No new cruises loaded");
                break;
            }
        }

        console.log("✅ Scraping completed");
    } catch (err) {
        console.error("❌ Error during scrape:", err.message);
    } finally {
        await browser.close();
    }
};

export { scrape_royal }
