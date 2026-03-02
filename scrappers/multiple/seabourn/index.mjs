import fs from "fs";
import puppeteer from "puppeteer";

const BASE_URL = "https://www.seabourn.com/en/find-a-cruise";
const OUTPUT_FILE = "./data.json";
const PAGE_SIZE = 4; // Seabourn har page me approx 20 cruises show karta hai

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
    return JSON.parse(fs.readFileSync(OUTPUT_FILE));
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

async function scrape_seabourn() {
    console.log("🚀 Starting Seabourn scraper...");

    initializeFile();
    let fileData = readFile();
    let allCruises = fileData.cruises || [];
    const existingLinks = new Set(allCruises.map(c => c.link));

    const browser = await puppeteer.launch({ headless: true, defaultViewport: null, args: ["--no-sandbox"] });
    const page = await browser.newPage();

    let pageIndex = 0;
    let morePages = true;

    function calculateEndDate(startDate, duration) {
        if (!startDate || !duration) return null;

        const match = duration.match(/^(\d+)/); // Extract number of days
        if (!match) return null;

        const days = parseInt(match[1]);
        if (isNaN(days)) return null;

        const start = new Date(startDate);
        start.setDate(start.getDate() + days); // add duration in days

        // format back to YYYY-MM-DD
        return start.toISOString().split("T")[0];
    }

    while (morePages) {
        const url = `${BASE_URL}?start=${pageIndex * PAGE_SIZE}&soldOut:(false)`;
        console.log(`➡️ Scraping URL: ${url}`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
        await page.waitForSelector(".cruise-molecule-search-result-card", { timeout: 60000 });

        const cruises = await page.$$eval(".cruise-molecule-search-result-card", cards =>
            cards.map(card => {
                function extractRoute(card) {
                    const dep = card.querySelector(".departure .value")?.innerText.trim() || null;
                    const arr = card.querySelector(".arrival .value")?.innerText.trim() || null;
                    if (!dep && !arr) return null;
                    if (!dep) return arr;
                    if (!arr) return dep;
                    return `${dep} to ${arr}`;
                }

                const route = extractRoute(card);

                const getText = sel => card.querySelector(sel)?.innerText.trim() || null;
                const titleRaw = getText(".cruise-atom-cruise-info__title .title");
                const year = getText(".csr-date-cmp .year");
                const sailing = getText(".csr-date-cmp .sailing");
                const priceAmount = card.querySelector(".cruise-atom-price-box__amount")?.innerText.trim();
                const imageSrc = card.querySelector("picture source[media='(min-width: 1440px)']")?.getAttribute("srcset");
                const shortCode = imageSrc?.match(/maps\/([^/]+)\//i)?.[1]?.toLowerCase() || null;
                // const link = shortCode ? `https://www.seabourn.com/en/find-a-cruise/${shortCode}` : null;

                return {
                    // title: titleRaw?.replace(/^\d+-Day\s*/i, "") || null,
                    title: route,
                    ship: getText(".ship .name") ? [getText(".ship .name")] : [],
                    departure: getText(".departure .value"),
                    arrival: getText(".arrival .value"),
                    year,
                    duration: titleRaw?.toLowerCase()?.includes("-day") ? titleRaw?.toLowerCase().split("-day")[0] + " DAYS" : null,
                    sailing,
                    price: priceAmount ? `$${Number(priceAmount.replace(/,/g, "")).toLocaleString()}` : null,
                    image: imageSrc ? "https://www.seabourn.com" + imageSrc : null,
                    link: null,
                    objectId: shortCode,
                };
            })
        );

        if (!cruises.length) {
            morePages = false;
            console.log("🛑 No more cruises found. Finished.");
            break;
        }

        const cleaned = cruises.map(c => {
            const statrDate = formatDate(c.year, c.sailing)

            return {
                title: c.title,
                ship: c.ship,
                duration: c?.duration,
                startDate: statrDate,
                endDate: calculateEndDate(statrDate, c?.duration),
                price: c.price,
                link: c.link,
                image: c.image,
                provider: "SEABOURN",
                objectId: c.objectId
            }
        });

        const fresh = cleaned.filter(c => c.image && !existingLinks.has(c.image));
        fresh.forEach(c => existingLinks.add(c.image));
        allCruises.push(...fresh);

        saveFile({ totalCruises: allCruises.length, scrapedAt: new Date().toISOString(), cruises: allCruises });
        console.log(`💾 Saved batch → Total: ${allCruises.length}`);

        pageIndex++;
        await delay(3000); // page load JS wait
    }

    await browser.close();
    console.log("🎉 Scraping completed successfully!");
}

export { scrape_seabourn }
