import puppeteer from "puppeteer-core";
import fs from "fs";

const OUTPUT_FILE = "./data.json";

/* ============================= */
/*        BATCH SAVE LOGIC       */
/* ============================= */
function appendBatch(newBatch) {
    let fileData = { totalCruises: 0, scrapedAt: null, cruises: [] };

    // Only load metadata, not all cruises
    if (fs.existsSync(OUTPUT_FILE)) {
        const oldDataRaw = fs.readFileSync(OUTPUT_FILE, "utf-8");
        if (oldDataRaw) {
            const oldData = JSON.parse(oldDataRaw);
            fileData.totalCruises = oldData.totalCruises || 0;
            fileData.scrapedAt = oldData.scrapedAt || null;
            fileData.cruises = oldData.cruises || [];
        }
    }

    // Compare newBatch only against existing links in JSON
    const existingLinks = new Set(fileData.cruises.map(c => c.link));
    const filteredBatch = newBatch.filter(c => !existingLinks.has(c.link));

    if (filteredBatch.length === 0) return;

    fileData.cruises.push(...filteredBatch);
    fileData.totalCruises = fileData.cruises.length;
    fileData.scrapedAt = new Date().toISOString();

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    console.log(`💾 Saved batch: ${filteredBatch.length} | Total: ${fileData.totalCruises}`);
}

/* ============================= */
/*        SCRAPER START          */
/* ============================= */
async function scrape_celebrity() {
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.setGeolocation({ latitude: 25.7617, longitude: -80.1918 });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(
        "https://www.celebritycruises.com",
        ["geolocation"]
    );

    await page.goto(
        "https://www.celebritycruises.com/cruises?country=USA",
        { waitUntil: "domcontentloaded", timeout: 0 }
    );

    await page.waitForSelector('div[id^="cruise-card_"]', { timeout: 60000 });
    console.log("🚀 Loading all cruises...");

    const pageLinksSet = new Set(); // track links seen on the page only

    while (true) {
        const newBatch = await page.$$eval('div[id^="cruise-card_"]', cards =>
            cards.map(card => {
                const linkPart = card.getAttribute("data-product-view-link") || "";
                const rawTitle =
                    card.querySelector('[data-testid^="cruise-name-label"]')?.innerText.trim() || "";
                const rawPrice =
                    card.querySelector('[data-testid^="cruise-price-label"]')?.innerText || "";

                function formatTitle(title) {
                    if (!title) return "";
                    let clean = title.trim().replace(/&/g, ",");
                    const parts = clean.split(",").map(p => p.trim()).filter(Boolean);
                    if (parts.length === 1) return `${parts[0]} to ${parts[0]}`;
                    return `${parts[0]} to ${parts[parts.length - 1]}`;
                }

                const link = linkPart ? `https://www.celebritycruises.com/${linkPart}` : "";

                return {
                    title: formatTitle(rawTitle),
                    duration:
                        card.querySelector('[data-testid^="cruise-duration-label"]')?.innerText.trim() || "",
                    ship: [card.querySelector('[data-testid^="cruise-ship-label"]')?.innerText.trim() || ""],
                    price: rawPrice.replace(/\n/g, "").replace(/\s+/g, "").replace(/^\$+/, "$"),
                    image: card.querySelector('img[data-nimg="fill"]')?.src || "",
                    startDate: card.getAttribute("data-start-date") || "",
                    endDate: card.getAttribute("data-end-date") || "",
                    link,
                    provider: "CELEBRITY_CRUISES"
                };
            })
        );

        // filter duplicates only in this page session
        const uniqueBatch = newBatch.filter(c => !pageLinksSet.has(c.link));
        uniqueBatch.forEach(c => pageLinksSet.add(c.link));

        appendBatch(uniqueBatch);

        const loadMoreBtn = await page.$('button[data-testid="load-more-button"]');
        if (!loadMoreBtn) break;

        await loadMoreBtn.evaluate(btn => btn.scrollIntoView({ behavior: "auto", block: "center" }));
        await loadMoreBtn.click();
        await new Promise(r => setTimeout(r, 2000));

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const newCardsLoaded = await page.waitForFunction(
            (selector, oldCount) => document.querySelectorAll(selector).length > oldCount,
            { polling: 500, timeout: 30000 },
            'div[id^="cruise-card_"]',
            pageLinksSet.size
        ).catch(() => false);

        if (!newCardsLoaded) break;
    }

    await browser.close();
    console.log("✅ Scraping Completed Successfully");
}

export { scrape_celebrity };