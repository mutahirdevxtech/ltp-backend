import fs from "fs";
import puppeteer from "puppeteer";

const URL = "https://www.cunard.com/en-gb/find-a-cruise";
const OUTPUT_FILE = "./data.json";

const delay = ms => new Promise(res => setTimeout(res, ms));

// ✅ Ensure file exists
function initializeFile() {
    if (!fs.existsSync(OUTPUT_FILE)) {
        fs.writeFileSync(
            OUTPUT_FILE,
            JSON.stringify({
                totalCruises: 0,
                scrapedAt: new Date().toISOString(),
                cruises: []
            }, null, 2)
        );
    }
}

// ✅ Read existing data
function readExistingData() {
    const raw = fs.readFileSync(OUTPUT_FILE);
    return JSON.parse(raw);
}

// ✅ Save data safely
function saveData(data) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

function saveDataAppend(newCruises) {
    let existingData = { totalCruises: 0, scrapedAt: null, cruises: [] };

    if (fs.existsSync(OUTPUT_FILE)) {
        const raw = fs.readFileSync(OUTPUT_FILE, "utf-8");
        if (raw) existingData = JSON.parse(raw);
    }

    // Merge + dedupe by link
    const map = new Map();
    [...existingData.cruises, ...newCruises].forEach(c => {
        if (c.link) map.set(c.link, c);
    });

    const merged = Array.from(map.values());

    const updatedData = {
        totalCruises: merged.length,
        scrapedAt: new Date().toISOString(),
        cruises: merged
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedData, null, 2), "utf-8");
    console.log(`💾 Appended ${newCruises.length} cruises → Total: ${merged.length}`);
}

async function scrape_cunard() {

    console.log("🚀 Opening Cunard...");

    // ✅ Ensure file exists but don't overwrite
    if (!fs.existsSync(OUTPUT_FILE)) {
        fs.writeFileSync(
            OUTPUT_FILE,
            JSON.stringify({ totalCruises: 0, scrapedAt: new Date().toISOString(), cruises: [] }, null, 2)
        );
    }

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119 Safari/537.36");
    await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });

    await page.goto(URL, { waitUntil: "networkidle2", timeout: 0 });
    let pageNo = 1;

    while (true) {
        console.log(`📄 Scraping page ${pageNo}`);

        await page.waitForSelector('[data-testid="po-cuk-cruise-tile-wrapper"]', { timeout: 60000 });

        const cruises = await page.$$eval('[data-testid="po-cuk-cruise-tile-wrapper"]', cards =>
            cards.map(card => {
                const text = sel => card.querySelector(sel)?.innerText.trim() || null;
                const info = card.querySelectorAll('[data-testid="po-cuk-text_p"]');
                const formatDate = dateStr => {
                    const date = new Date(dateStr);
                    return isNaN(date) ? null : date.toISOString().split("T")[0];
                };
                return {
                    title: text("h5")?.split(",")[0]?.trim() || null,
                    ship: info[0]?.children[0]?.innerText.trim() ? [info[0].children[0].innerText.trim()] : [],
                    duration: info[0]?.children[1]?.innerText.trim().toUpperCase() || null,
                    startDate: formatDate(info[1]?.children[1]?.innerText.trim()),
                    endDate: formatDate(info[2]?.children[1]?.innerText.trim()),
                    price: card.querySelector(".e188-Price__price__e3f3d")?.innerText.trim() || null,
                    link: card.querySelector("a")?.href || null,
                    image: card.querySelector("img")?.src || null,
                    provider: "CUNARD"
                };
            })
        );

        // ✅ Append new cruises to existing file safely
        saveDataAppend(cruises);

        // 👉 NEXT BUTTON
        const nextBtn = await page.$('[data-testid="po-cuk-next-btn"]');
        if (!nextBtn) break;

        const disabled = await page.evaluate(el => el.getAttribute("aria-disabled"), nextBtn);
        if (disabled === "true") break;

        const firstCard = await page.$('[data-testid="po-cuk-cruise-tile-wrapper"]');

        await Promise.all([
            page.evaluate(btn => btn.click(), nextBtn),
            page.waitForFunction(el => !document.body.contains(el), { timeout: 60000 }, firstCard)
        ]);

        await delay(1500);
        pageNo++;
    }

    console.log("🎉 Scraping finished!");
    await browser.close();
}

export { scrape_cunard }
