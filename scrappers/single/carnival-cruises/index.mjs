import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

/**
 * Fetch HTML from a URL
 */
async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    return data;
}

/**
 * Parse Carnival Cruises Itinerary
 */
function parseCarnivalCruises(html) {
    const $ = cheerio.load(html);
    const itinerary = [];
    const countriesSet = new Set();

    $("div[data-testid^='dayTile']").each((i, el) => {
        const dayTitle = $(el).find("h3.sc-eDOMzu").text().trim(); // e.g. "Day 1: Long Beach (Los Angeles)"

        // ✅ Skip if it doesn't start with "Day"
        if (!dayTitle.startsWith("Day")) return;

        const scheduleSpans = $(el).find("div[data-testid='dayTileSchedule'] span.sc-fbUgXY");
        let port = dayTitle.split(":")[1]?.trim() || "At Sea";
        let country = "At Sea";
        let arrival = null;
        let departure = null;

        // Determine country from port text
        if (!port.toLowerCase().includes("sea")) {
            const parts = port.split(",");
            country = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
        }

        // Parse times
        if (scheduleSpans.length === 2) {
            arrival = scheduleSpans.eq(0).text().trim().replace("-", "").trim() || null;
            departure = scheduleSpans.eq(1).text().trim().replace("-", "").trim() || null;
        } else if (scheduleSpans.length === 1) {
            const timeText = scheduleSpans.eq(0).text().trim();
            if (timeText.toLowerCase().includes("departs")) departure = timeText.replace("Departs at", "").trim();
            else if (timeText.toLowerCase().includes("arrives")) arrival = timeText.replace("Arrives at", "").trim();
            else departure = timeText;
        }

        if (country !== "At Sea") {
            countriesSet.add(country);
        }

        const exist = itinerary.find((i) => i?.day === dayTitle?.split(":")[0].trim())

        if (!exist) {
            itinerary.push({
                day: dayTitle.split(":")[0].trim(),
                port,
                country,
                arrival,
                departure
            });
        }

    });

    return {
        totalPorts: itinerary.length,
        totalCountries: countriesSet.size,
        countries: Array.from(countriesSet),
        itinerary
    };
}

/**
 * Main Scraper
 */
async function scrapeCarnival(url) {
    // https://www.carnival.com/itinerary/3-day-baja-mexico-cruise/long-beach-los-angeles/firenze/3-days/lx5?itinportcode=LAX&sailDate=12182026&numGuests=2&military=N&senior=N&pastGuest=N&evsel=&hideSailingEvents=true&locality=1&currency=USD&roomType=IS
    try {
        console.log("🚀 Fetching Carnival Cruises page...");
        const html = await fetchHTML(url);

        console.log("📄 Parsing itinerary...");
        const result = parseCarnivalCruises(html);
        return result
        // fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
        console.log("✅ Done! data.json created successfully.");
    } catch (err) {
        console.error("❌ Error:", err.message);
        return null
    }
}

export { scrapeCarnival }
