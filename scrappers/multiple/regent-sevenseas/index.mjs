import puppeteer from "puppeteer";
import fs from "fs";
import * as cheerio from "cheerio";

function parseStartDate(dateStr) {
    // "Feb 28 2026" -> Date object
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
    if (!date || !days) return null;
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDate(date) {
    if (!date) return null;
    // e.g. "2026-03-14"
    return date.toISOString().split("T")[0];
}

function saveProgress(outputFile, newCruises) {
    let existingData = {
        totalCruises: 0,
        scrapedAt: null,
        cruises: []
    };

    // 1️⃣ If file exists, read old data
    if (fs.existsSync(outputFile)) {
        try {
            const raw = fs.readFileSync(outputFile, "utf-8");
            existingData = JSON.parse(raw);
        } catch (err) {
            console.log("⚠️ Could not parse existing file, starting fresh.");
        }
    }

    // 2️⃣ Merge old + new cruises
    const mergedCruises = [
        ...(existingData.cruises || []),
        ...newCruises
    ];

    // 3️⃣ Remove duplicates (based on link)
    const uniqueCruises = Array.from(
        new Map(mergedCruises.map(c => [c.link, c])).values()
    );

    const finalData = {
        totalCruises: uniqueCruises.length,
        scrapedAt: new Date().toISOString(),
        cruises: uniqueCruises
    };

    fs.writeFileSync(
        outputFile,
        JSON.stringify(finalData, null, 2),
        "utf-8"
    );

    console.log(`💾 Progress saved: ${uniqueCruises.length} cruises`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrape_regent_sevenseas(outputFile = "./data.json") {
    const LIST_SELECTOR = "ul.cruiseList";
    const ITEM_SELECTOR = "li.cruiseList_item";

    console.log("🚀 Launching browser...");
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = await browser.newPage();

    let allCruises = [];
    let cruiseLinks = new Set(); // deduplicate
    let saveCounter = 0;
    let pageNum = 1;

    while (true) {
        const pageUrl =
            pageNum === 1
                ? "https://www.rssc.com/cruises"
                : `https://www.rssc.com/cruises?pageNumber=${pageNum}`;

        console.log(`📄 Scraping page ${pageNum}: ${pageUrl}`);
        await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 60000 });

        // Wait a bit for lazy content
        await sleep(3000);

        // Wait for list or stop
        try {
            await page.waitForSelector(LIST_SELECTOR, { timeout: 10000 });
        } catch {
            console.log("⚠️ No results list found, stopping.");
            break;
        }

        const html = await page.content();
        const $ = cheerio.load(html);

        const items = $(ITEM_SELECTOR);
        if (items.length === 0) {
            console.log("⚠️ No cruise items on this page, stopping.");
            break;
        }

        console.log(`🔎 Found ${items.length} items on page ${pageNum}`);


        items.each((_, li) => {
            const el = $(li);

            // Title
            const from = el.find(".c89_header_title span").first().text().trim();
            const to = el.find(".c89_header_subtitle span").first().text().trim();
            const title = from && to ? `${from} to ${to}` : null;

            const ship = el.find(".c89_header_ship span").first().text().trim() || null;


            // Dates (start)
            const departMonthDay = el
                .find(".listing_item .e27_item.-primaryInfo span")
                .first()
                .text()
                .replace(/\s+/g, " ")
                .trim();

            const departYear = el
                .find(".listing_item .e27_item.-secondaryInfo span")
                .first()
                .text()
                .replace(/\s+/g, " ")
                .trim();

            let startDate = null;
            if (departMonthDay && departYear) {
                const parsedStart = parseStartDate(`${departMonthDay} ${departYear}`);
                startDate = formatDate(parsedStart); // now YYYY-MM-DD
            }

            // Duration
            let duration = null;
            el.find(".listing_item").each((_, li2) => {
                const label = $(li2).find(".e27_item.-description span").text().trim();
                if (/duration/i.test(label)) {
                    const nghts = $(li2).find(".e27_item.-primaryInfo span").text().trim();
                    duration = nghts ? `${nghts} NIGHTS` : null;
                }
            });

            // Price
            let price = null;
            el.find(".listing_item").each((_, li2) => {
                const label = $(li2).find(".e27_item.-description span").text().trim();
                if (/fare/i.test(label)) {
                    price = $(li2).find(".e27_item.-primaryInfo span").text().trim() || null;
                }
            });

            // ---- ✅ Calculate endDate from startDate + duration ----
            let endDate = null;
            let durationDays = null;

            if (duration) {
                const m = duration.match(/\d+/);
                if (m) durationDays = parseInt(m[0], 10);
            }

            if (startDate && durationDays) {
                const start = parseStartDate(startDate); // parse again for safety
                const end = addDays(start, durationDays);
                endDate = formatDate(end); // YYYY-MM-DD
            }

            // Link
            const linkRel = el.find("a.c329_figure_link").attr("href");
            const link = linkRel ? new URL(linkRel, "https://www.rssc.com").href : null;

            // Image
            const imgSrc = el.find("img").first().attr("src");
            const image = imgSrc ? new URL(imgSrc, "https://www.rssc.com").href : null;

            const cruise = {
                title,
                ship: ship ? [ship] : [],
                startDate,
                endDate,          // ✅ now real calculated value
                duration,
                price,
                link,
                image,
                provider: "REGENT_SEVEN_SEAS",
            };

            if (link && !cruiseLinks.has(link)) {
                allCruises.push(cruise);
                cruiseLinks.add(link);
                saveCounter++;

                if (saveCounter % 10 === 0) {
                    saveProgress(outputFile, allCruises);
                }
            }
        });

        pageNum++;
        await sleep(1500); // polite delay
    }

    await browser.close();
    saveProgress(outputFile, allCruises);
    console.log(`✅ Done! Total cruises scraped: ${allCruises.length}`);
}

export { scrape_regent_sevenseas }

// Run directly
// scrape_regent_sevenseas();
