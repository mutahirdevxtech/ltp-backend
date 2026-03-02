import fs from "fs";
import puppeteer from "puppeteer";
import path from "path";

const BASE_URL = "https://www.hollandamerica.com/en/find-a-cruise";
const OUTPUT_FILE = path.resolve("./data.json");
const PAGE_SIZE = 4; // Holland America uses 20 per page

const delay = ms => new Promise(res => setTimeout(res, ms));

function initializeFile() {
    if (!fs.existsSync(OUTPUT_FILE)) {
        fs.writeFileSync(
            OUTPUT_FILE,
            JSON.stringify({ totalCruises: 0, scrapedAt: new Date().toISOString(), cruises: [] }, null, 2)
        );
    }
}

function readFile() {
    try {
        return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    } catch (err) {
        console.log("⚠️ JSON file empty or invalid. Starting fresh.");
        return { totalCruises: 0, cruises: [] };
    }
}

function saveFile(data) {
    fs.writeFileSync(OUTPUT_FILE + ".tmp", JSON.stringify(data, null, 2));
    fs.renameSync(OUTPUT_FILE + ".tmp", OUTPUT_FILE);
}

function formatDate(year, sailing) {
    if (!year || !sailing) return null;
    const [monthStr, day] = sailing.split(" ");
    const months = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };
    return `${year}-${months[monthStr]}-${day.padStart(2, "0")}`;
}

function calculateEndDate(startDate, duration) {
    if (!startDate || !duration) return null;
    const match = duration.match(/^(\d+)/);
    if (!match) return null;
    const days = parseInt(match[1]);
    if (isNaN(days)) return null;
    const start = new Date(startDate);
    start.setDate(start.getDate() + days);
    return start.toISOString().split("T")[0];
}

async function scrape_hollandamerica() {
    console.log("🚀 Starting Holland America scraper...");

    initializeFile();
    let fileData = readFile();
    let allCruises = fileData.cruises || [];
    const existingIds = new Set(allCruises.map(c => c.image));

    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = await browser.newPage();

    let pageIndex = 0;
    let morePages = true;

    while (morePages) {
        const url = `${BASE_URL}?start=${pageIndex * PAGE_SIZE}`;
        console.log(`➡️ Scraping URL: ${url}`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
        try {
            await page.waitForSelector(".cruise-molecule-search-result-card", { timeout: 30000 });
        } catch {
            console.log("🛑 No cruises found on this page. Ending pagination.");
            break;
        }

        const cruises = await page.$$eval(".cruise-molecule-search-result-card", cards =>
            cards.map(card => {
                const getText = sel => card.querySelector(sel)?.innerText.trim() || null;
                const route = `${getText(".departure .value")} to ${getText(".arrival .value")}`;
                const titleRaw = getText(".cruise-atom-cruise-info__title .title");
                const year = getText(".csr-date-cmp .year");
                const sailing = getText(".csr-date-cmp .sailing");
                const price = getText(".cruise-atom-price-box__amount");
                const image = card.querySelector(".cruise-map-image-container source")?.getAttribute("srcset") ||
                    card.querySelector(".cruise-map-image-container img")?.getAttribute("src") ||
                    null;
                const parts = image?.split("/") || [];
                const shortCode = parts[parts.length - 2] || image;
                const link = shortCode ? `https://www.hollandamerica.com/en/find-a-cruise/${shortCode}` : null;
                return {
                    title: route,
                    ship: getText(".ship .name") ? [getText(".ship .name")] : [],
                    startDate: sailing,
                    duration: titleRaw?.toLowerCase()?.includes("-day") ? titleRaw?.toLowerCase().split("-day")[0] + " DAYS" : null,
                    price: price ? ("$" + price) : null,
                    image: "https://www.hollandamerica.com" + image,
                    link: link,
                    objectId: shortCode,
                    year,
                    sailing
                };
            })
        );

        if (!cruises.length) {
            console.log("🛑 No more cruises found. Finished pagination.");
            break;
        }

        // Format and filter new cruises
        const cleaned = cruises.map(c => {
            const startDate = formatDate(c.year, c.sailing);
            return {
                title: c.title,
                ship: c.ship,
                duration: c.duration,
                startDate,
                endDate: calculateEndDate(startDate, c.duration),
                price: c.price,
                image: c.image,
                link: c.link,
                provider: "HOLLAND_AMERICA",
                objectId: c.objectId
            };
        })
            .filter(c => !existingIds.has(c.image));

        cleaned.forEach(c => existingIds.add(c.image));
        allCruises.push(...cleaned);

        saveFile({ totalCruises: allCruises.length, scrapedAt: new Date().toISOString(), cruises: allCruises });
        console.log(`💾 Saved batch → Total cruises: ${allCruises.length}`);

        pageIndex++;
        await delay(3000);
    }

    await browser.close();
    console.log("🎉 Holland America scraping completed!");
}

export { scrape_hollandamerica };
