import puppeteer from "puppeteer";
import fs from "fs";
import * as cheerio from "cheerio";

////////////////////////////////////////////////////////////
// APPEND + DEDUP SAVE FUNCTION
////////////////////////////////////////////////////////////

function saveProgress(outputFile, newCruises) {
    let existingData = {
        totalCruises: 0,
        scrapedAt: null,
        cruises: [],
    };

    // Read existing file if exists
    if (fs.existsSync(outputFile)) {
        try {
            const raw = fs.readFileSync(outputFile, "utf-8");
            existingData = JSON.parse(raw);
        } catch {
            console.log("⚠️ Could not read existing file, creating new one.");
        }
    }

    // Merge existing + new
    const merged = [
        ...(existingData.cruises || []),
        ...newCruises
    ];

    // Remove duplicates by link
    const uniqueMap = new Map();
    for (const cruise of merged) {
        if (cruise.link) {
            uniqueMap.set(cruise.link, cruise);
        }
    }

    const finalCruises = Array.from(uniqueMap.values());

    const finalData = {
        totalCruises: finalCruises.length,
        scrapedAt: new Date().toISOString(),
        cruises: finalCruises,
    };

    fs.writeFileSync(
        outputFile,
        JSON.stringify(finalData, null, 2),
        "utf-8"
    );

    console.log(`💾 Saved batch. Total cruises now: ${finalCruises.length}`);
}

////////////////////////////////////////////////////////////
// SCRAPER
////////////////////////////////////////////////////////////

async function scrape_silversea(outputFile = "./data.json") {
    const RESULTS_UL_SELECTOR = "ul.SearchResults-module--search-results--7f25e";
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log("🚀 Launching browser...");
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = await browser.newPage();

    let allCruises = [];
    let cruiseLinks = new Set();
    let batchCruises = [];
    let pageNum = 1;

    while (true) {
        const pageUrl =
            pageNum === 1
                ? "https://www.silversea.com/find-a-cruise.html"
                : `https://www.silversea.com/find-a-cruise.html?toggle%5Bavailable%5D=true&page=${pageNum}`;

        console.log(`📄 Scraping page ${pageNum}: ${pageUrl}`);
        await page.goto(pageUrl, { waitUntil: "networkidle2" });

        try {
            await page.waitForSelector(RESULTS_UL_SELECTOR, { timeout: 10000 });
        } catch {
            console.log("⚠️ No results found, stopping.");
            break;
        }

        await sleep(1000);

        const pageData = await page.$eval(
            RESULTS_UL_SELECTOR,
            (el) => el.outerHTML
        );

        const $ = cheerio.load(pageData);
        const cruiseItems = $("li.SearchResults-module--item--12615");

        if (cruiseItems.length === 0) {
            console.log("⚠️ No cruise items found, stopping.");
            break;
        }

        cruiseItems.each((_, li) => {
            const el = $(li);

            const title =
                el.find("h3").first().text().replace(/\s+/g, " ").trim() || null;

            const ship =
                el.find(".EmotionalCruiseCard-module_ship-info__XIO7K > div")
                    .first()
                    .text()
                    .replace(/\s+/g, " ")
                    .trim() || null;

            const dateTimes = el.find(
                ".CruiseDates-module_container__LU3EO time"
            );

            let startDate = null,
                endDate = null;

            if (dateTimes.length >= 2) {
                startDate =
                    $(dateTimes[0]).attr("datetime") ||
                    $(dateTimes[0]).text().trim();

                endDate =
                    $(dateTimes[1]).attr("datetime") ||
                    $(dateTimes[1]).text().trim();
            }

            const duration =
                el.find(".CruiseDates-module_duration__-S30M time")
                    .first()
                    .text()
                    .trim() || null;

            const price =
                el.find(".PriceBox-module_price-value__ZvIGK")
                    .first()
                    .text()
                    .replace(/\s+/g, " ")
                    .trim() || null;

            const a = el.find("a").first();
            const link = a.attr("href")
                ? new URL(a.attr("href"), "https://www.silversea.com").href
                : null;

            const img = el.find("img").first();
            const image = img.attr("src") || null;

            const cruise = {
                title,
                ship: ship ? [ship] : [],
                startDate,
                endDate,
                duration,
                price,
                link,
                image,
                provider: "SILVERSEA",
            };

            if (link && !cruiseLinks.has(link)) {
                allCruises.push(cruise);
                batchCruises.push(cruise);
                cruiseLinks.add(link);

                // Save every 10 cruises
                if (batchCruises.length === 10) {
                    saveProgress(outputFile, batchCruises);
                    batchCruises = [];
                }
            }
        });

        pageNum++;
        await sleep(1000);
    }

    // Save remaining batch
    if (batchCruises.length > 0) {
        saveProgress(outputFile, batchCruises);
    }

    await browser.close();
    console.log(`✅ Done! Total cruises scraped this run: ${allCruises.length}`);
}

export { scrape_silversea };

// scrape_silversea();
