import puppeteer from "puppeteer";
import fs from "fs";

const OUTPUT_FILE = "./data.json";
const BATCH_SIZE = 10;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

/* ============================= */
/*        BATCH SAVE LOGIC       */
/* ============================= */
function appendBatch(newBatch) {
    let fileData = { totalCruises: 0, scrapedAt: null, cruises: [] };
    if (fs.existsSync(OUTPUT_FILE)) {
        const oldData = fs.readFileSync(OUTPUT_FILE, "utf-8");
        if (oldData) fileData = JSON.parse(oldData);
    }

    fileData.cruises = [...fileData.cruises, ...newBatch];
    fileData.totalCruises = fileData.cruises.length;
    fileData.scrapedAt = new Date().toISOString();

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    console.log(`💾 Saved batch: ${newBatch.length} | Total: ${fileData.totalCruises}`);
}

/* ============================= */
/*        SCRAPER START          */
/* ============================= */
async function scrape_carnival() {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null, args: ["--no-sandbox"] });

    try {
        const page = await browser.newPage();
        await page.goto(
            "https://www.carnival.com/cruise-search?pageNumber=1&numadults=2&pagesize=8&sort=fromprice&showBest=true&async=true&currency=USD&locality=1",
            { waitUntil: "domcontentloaded", timeout: 0 }
        );

        const CARD = 'div[data-testid^="tripTile_"]';
        const LOAD_MORE = '[data-testid="loadMoreResults"]';

        await page.waitForSelector(CARD);
        console.log("🚀 Loading all Carnival cruises...");

        let savedCount = 0;

        while (true) {
            const currentCount = await page.$$eval(CARD, el => el.length);
            console.log("📦 Cruises Loaded:", currentCount);

            if (currentCount > savedCount) {
                const newCards = await page.$$eval(
                    CARD,
                    (cards, start, batchSize) => cards.slice(start, start + batchSize).map(card => {
                        const titleRaw = card.querySelector('[data-testid="itinerary-title"]')?.innerText.trim() || "";
                        const ship = card.querySelector('[data-testid^="cg-ship_"]')?.innerText.trim() || "";
                        const durationRaw = card.querySelector('[data-testid^="cg-date_"]')?.innerText.trim() || "";
                        const priceRaw = card.querySelector('[data-testid="priceContainer"]')?.innerText.replace(/\s+/g, "") || "";
                        const link = card.querySelector('a[data-testid^="cg-itinerary_"]')?.href || "";
                        const imgBg = card.querySelector('[data-testid^="img_"]')?.style.backgroundImage || "";
                        const image = imgBg ? imgBg.replace(/^url\(["']?/, "").replace(/["']?\)$/, "") : "";

                        // startDate/endDate not on page? null
                        const startDate = card.getAttribute("data-start-date") || null;
                        const endDate = card.getAttribute("data-end-date") || null;

                        /* ============================= */
                        /*        TITLE FORMAT LOGIC     */
                        /* ============================= */
                        function formatTitle(titleRaw) {
                            if (!titleRaw) return "";
                            let clean = titleRaw.trim().replace(/&/g, ",");
                            const parts = clean.split(",").map(p => p.trim()).filter(Boolean);
                            // Simple case: agar sirf 1 part hai
                            if (parts.length === 1) return `${parts[0]} to ${parts[0]}`;

                            // Agar multiple parts hain
                            let formatted = `${parts[0]} to ${parts[parts.length - 1]}`;
                            // "from" ke baad ka part extract karna safely
                            if (formatted.toLowerCase().includes("from")) {
                                const afterFrom = formatted.split("from")[1];
                                if (afterFrom) return afterFrom.trim(); // safe
                            }

                            return formatted;
                        }

                        function formatDuration(d) {
                            if (!d) return null;
                            let t = d.replace(/-/g, "").toUpperCase() + "S"
                            return t.split("DAYS")[0] + " " + "DAYS";
                        }

                        function formatPrice(p) {
                            if (!p) return null;
                            return p.replace(/\*$/, ""); // remove last *
                        }

                        return {
                            title: titleRaw ? formatTitle(titleRaw) : null,
                            ship: ship ? [ship] : [],
                            duration: formatDuration(durationRaw),
                            price: formatPrice(priceRaw),
                            link,
                            image: image.startsWith("http") ? image : `https://www.carnival.com${image}`,
                            startDate,
                            endDate,
                            provider: "CARNIVAL"
                        };
                    }),
                    savedCount,
                    BATCH_SIZE
                );

                if (newCards.length > 0) {
                    appendBatch(newCards);
                    savedCount += newCards.length;
                }
            }

            // Load more button
            const btn = await page.$(LOAD_MORE);
            if (!btn) {
                console.log("✅ Load More finished");
                break;
            }
            await btn.evaluate(el => el.scrollIntoView({ block: "center" }));
            await delay(800);
            await page.evaluate(() => document.querySelector('[data-testid="loadMoreResults"]')?.click());

            try {
                await page.waitForFunction(
                    (selector, count) => document.querySelectorAll(selector).length > count,
                    { timeout: 60000 },
                    CARD,
                    savedCount
                );
            } catch {
                console.log("🛑 No more new cruises");
                break;
            }
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await browser.close();
        console.log("✅ Scraping Completed Successfully");
    }
};

export { scrape_carnival }
