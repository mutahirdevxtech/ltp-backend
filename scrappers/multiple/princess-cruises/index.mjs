import puppeteer from "puppeteer";
import fs from "fs";

const URL = "https://www.princess.com/cruise-search/results/?resType=C";
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const SAVE_FILE = "./data.json";

const saveData = (newCruises) => {
    let existingData = {
        totalCruises: 0,
        scrapedAt: null,
        cruises: [],
    };

    // 1️⃣ Read existing data if file exists
    if (fs.existsSync(SAVE_FILE)) {
        const fileContent = fs.readFileSync(SAVE_FILE, "utf-8");
        if (fileContent) {
            existingData = JSON.parse(fileContent);
        }
    }

    // 2️⃣ Merge + dedupe based on unique link
    const map = new Map();
    [...existingData.cruises, ...newCruises].forEach((c) => {
        if (c.link) map.set(c.link, c);
    });

    const mergedCruises = Array.from(map.values());

    // 3️⃣ Update metadata
    existingData.cruises = mergedCruises;
    existingData.totalCruises = mergedCruises.length;
    existingData.scrapedAt = new Date().toISOString();

    // 4️⃣ Write back to file
    fs.writeFileSync(SAVE_FILE, JSON.stringify(existingData, null, 2), "utf-8");

    console.log(`💾 Saved | New batch: ${newCruises.length} | Total: ${mergedCruises.length}`);
};

const scrape_princess = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        slowMo: 50,
    });

    const page = await browser.newPage();

    console.log("Opening page...");
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 0 });
    await delay(4000);

    console.log("Scrolling initial page...");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(4000);

    let allCruises = [];
    let previousCount = 0;
    let sameCountTimes = 0;

    console.log("Clicking Load More buttons and saving incrementally...");

    while (true) {

        // Check Load More button first
        const button = await page.$("button.secondary-btn");

        if (!button) {
            console.log("No Load More button found. Final extraction...");
        } else {
            await page.evaluate((btn) => btn.click(), button);
            console.log("Clicked Load More, waiting 4s...");
            await delay(4000);

            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await delay(4000);
        }

        // 🔥 NOW extract AFTER load more
        const cruises = await page.evaluate(() => {
            const results = [];

            const parseDate = (text, fallbackText) => {
                let dateText = text || fallbackText;
                if (!dateText) return { startDate: null, ship: null };

                // Format can be either:
                // "Wed, May 31, 2028 - Grand Princess" (dropdown)
                // "Mon, Feb 28, 2028 on Grand Princess" (div fallback)
                let parts = [];
                if (dateText.includes(" - ")) {
                    parts = dateText.split(" - ");
                } else if (dateText.includes(" on ")) {
                    parts = dateText.split(" on ");
                } else {
                    return { startDate: null, ship: null };
                }

                const datePart = parts[0]?.replace(/^[A-Za-z]+,\s*/, "").trim();
                const shipName = parts[1]?.trim() || null;

                const parsedDate = new Date(datePart);
                const isoDate = !isNaN(parsedDate)
                    ? parsedDate.toISOString().split("T")[0]
                    : null;

                return { startDate: isoDate, ship: shipName };
            };

            document.querySelectorAll(".product-container").forEach((el) => {
                const route =
                    el.querySelector(".details-ports")?.innerText?.split("\n")[0]?.trim() ||
                    null;

                const voyageLink =
                    el.querySelector(".details-header a")?.href || null;

                const image =
                    el.querySelector(".product-img img")?.src || null;

                const durationText =
                    el.querySelector(".details-header a")?.innerText || "";

                const durationMatch = durationText.match(/(\d+-Day|\d+ Day)/i);
                const duration = durationMatch
                    ? durationMatch[0].toUpperCase().replace("-", " ")
                    : null;

                const price =
                    el.querySelector(".price .amount")?.innerText?.trim() || null;

                const dateDropdown =
                    el.querySelector(".css-qc6sy-singleValue")?.innerText || null;

                // Fallback for div when dropdown not available
                const dateDiv =
                    el.querySelector(".col-xs-6.date-ship")?.innerText || null;

                const { startDate, ship } = parseDate(dateDropdown, dateDiv);

                let endDate = null;
                if (startDate && duration) {
                    const days = parseInt(duration);
                    if (!isNaN(days)) {
                        const start = new Date(startDate);
                        start.setDate(start.getDate() + days);
                        endDate = start.toISOString().split("T")[0];
                    }
                }

                results.push({
                    title: route,
                    ship: ship ? [ship] : [],
                    startDate,
                    endDate,
                    duration: duration?.includes("DAYS") ? duration : duration + "S",
                    price: price ? ("$" + Number(price.replace("$", "")).toLocaleString()) : null,
                    link: voyageLink,
                    image,
                    provider: "PRINCESS_CRUISES",
                });
            });

            return results;
        });

        // Merge + dedupe
        const map = new Map();
        [...allCruises, ...cruises].forEach((c) => {
            if (c.link) map.set(c.link, c);
        });

        const updated = Array.from(map.values());

        if (updated.length === allCruises.length) {
            sameCountTimes++;
        } else {
            sameCountTimes = 0;
            allCruises = updated;
            console.log("New data found. Saving...");
            saveData(allCruises);
        }

        if (!button || sameCountTimes >= 3) {
            console.log("Stopping scraper...");
            break;
        }
    }

    console.log("Scraping finished. Total unique cruises:", allCruises.length);
    saveData(allCruises);

    await browser.close();
};

export { scrape_princess }
