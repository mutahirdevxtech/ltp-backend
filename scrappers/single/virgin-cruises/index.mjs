import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fetch HTML from a given URL
 */
async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
    });
    return data;
}

/**
 * Clean string: remove emojis & extra text like 'local time'
 */
function cleanText(text) {
    if (!text) return null;
    // remove emojis
    text = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, "");
    // remove 'local time'
    text = text.replace(/,?\s*local time/gi, "");
    // trim
    return text.trim() || null;
}

/**
 * Parse itinerary from Virgin Voyages cruise page
 */
function parseItinerary(html) {
    const $ = cheerio.load(html);
    const itinerary = [];
    const countriesSet = new Set();

    $(".ItineraryListNew__item").each((i, el) => {
        const day = $(el).find(".ItineraryListNew__daySection").text().trim();
        const locationEl = $(el).find(".ItineraryListNew__location").first();

        let port = locationEl.text().trim() || "At Sea";
        let country = null;

        if (port !== "Sailing" && port !== "At Sea") {
            const parts = port.split(",");
            if (parts.length >= 2) {
                country = parts[parts.length - 1].trim();
            } else {
                country = parts[0].trim();
            }
        } else {
            country = "At Sea";
            port = "At Sea";
        }

        countriesSet.add(country);

        // Arrival / Departure
        let desc = $(el).find(".ItineraryListNew__description").text().trim() || "";
        desc = cleanText(desc) || "";

        let arrival = null;
        let departure = null;

        if (desc && desc.includes("-")) {
            const times = desc.split("-").map(t => t.trim());
            arrival = times[0] || null;
            departure = times[1] || null;
        } else if (desc) {
            arrival = desc;
        }

        itinerary.push({
            date: `Day ${day}`,
            port: port.replaceAll(" ", " "),
            country,
            arrival,
            departure
        });
    });

    const countries = Array.from(countriesSet);

    return {
        totalPorts: itinerary.length,
        totalCountries: countries.length,
        countries,
        itinerary
    };
}

/**
 * Main function
 */
async function getSingleCruiseDataVirgin(url) {
    try {
        const html = await fetchHTML(url);
        const result = parseItinerary(html);
        return result
        
    } catch (err) {
        console.error(err.message);
    }
}

export { getSingleCruiseDataVirgin }