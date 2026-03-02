import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * Convert ISO/other date string to DD-MM-YYYY
 */
function formatDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date)) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * Read existing data file (if exists)
 */
function readExisting(filePath) {
    if (!fs.existsSync(filePath)) {
        return {
            totalCruises: 0,
            scrapedAt: new Date().toISOString(),
            cruises: []
        };
    }
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
    } catch {
        return {
            totalCruises: 0,
            scrapedAt: new Date().toISOString(),
            cruises: []
        };
    }
}

/**
 * Save progress to same file
 */
function saveProgress(filePath, cruises) {
    const obj = {
        totalCruises: cruises.length,
        scrapedAt: new Date().toISOString(),
        cruises
    };
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
    console.log(`💾 Saved progress: ${cruises.length} cruises`);
}

/**
 * Fetch URL with retries
 */
async function fetchWithRetry(url, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Connection": "keep-alive",
                    "Referer": "https://www.oceaniacruises.com/",
                },
                timeout: 60000
            });
            return data;
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
        }
    }
    throw new Error("All fetch attempts failed");
}

/**
 * Fetch all Oceania cruises and save incrementally in ONE file
 */
async function scrape_oceania() {
    console.log("Fetching Oceania cruises...");

    const baseURL = "https://www.oceaniacruises.com/api/cruise-details/v1/cruises";
    const pageSize = 150;
    let page = 1;
    let totalPages = 1;

    const filePath = path.resolve("./data.json");

    // Load existing progress
    const existing = readExisting(filePath);
    let allCruises = existing.cruises || [];

    // For dedupe (by link)
    const seenLinks = new Set(allCruises.map(c => c.link).filter(Boolean));

    let saveCounter = 0;

    try {
        while (page <= totalPages) {
            const url = `${baseURL}?filters=duration%7Ctime_frame%7Cnot:port%7Cport%7Cship%7Cmarketing_region&sort=featured:desc&page=${page}&pageSize=${pageSize}`;
            const data = await fetchWithRetry(url);

            if (!data?.results) break;

            if (page === 1) {
                const totalRecords = data.pagination?.totalRecords || 0;
                totalPages = Math.ceil(totalRecords / pageSize);
            }

            for (const c of data.results) {
                const cruise = {
                    title: (c?.embarkPortName && c?.debarkPortName)
                        ? `${c.embarkPortName} to ${c.debarkPortName}`
                        : null,
                    ship: c?.shipName ? [c?.shipName] : [],
                    startDate: formatDate(c.embarkDate),
                    endDate: formatDate(c.debarkDate),
                    duration: c.duration ? `${c.duration} DAYS` : null,
                    price: c.faresFrom || null,
                    link: c.detailsURL ? `https://www.oceaniacruises.com${c.detailsURL}` : null,
                    image: c.image?.src ? `https://www.oceaniacruises.com${c.image.src}` : null,
                    provider: "OCEANIA_CRUISES"
                };

                // Deduplicate by link
                if (cruise.link && seenLinks.has(cruise.link)) {
                    continue;
                }

                allCruises.push(cruise);
                if (cruise.link) seenLinks.add(cruise.link);

                saveCounter++;

                // Save every 10 items
                if (saveCounter % 10 === 0) {
                    saveProgress(filePath, allCruises);
                }
            }

            page++;
        }

        // Final save
        saveProgress(filePath, allCruises);

        console.log(`✅ Done! Total cruises: ${allCruises.length}`);
        return allCruises;

    } catch (err) {
        console.error("Oceania fetch error:", err.message);
        // Still save whatever we have
        saveProgress(filePath, allCruises);
        return null;
    }
}

// // Run
// (async () => {
//     const data = await scrape_oceania();
//     console.log(`Total cruises fetched: ${data?.length || 0}`);
// })();

export { scrape_oceania };
