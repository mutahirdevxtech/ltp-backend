import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fetch HTML from a given URL
 * @param {string} url
 * @returns {string} HTML content
 */
async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    return data;
}

/**
 * Extract NCL cruise itinerary info from HTML
 * @param {string} html
 * @returns {Object} cruise data
 */
function extractNclCruiseInfo(html) {
    const $ = cheerio.load(html);

    const cruiseData = {
        totalPorts: 0,
        totalCountries: 0,
        countries: [],
        itinerary: []
    };

    const countriesSet = new Set();

    // Loop through each itinerary item
    $("ul.c229 li.c229_item").each((i, li) => {
        const item = $(li);

        const dayName = item.find(".c228_subtitle span").text().trim();

        const portText = item
            .find(".e58_text span")
            .first()
            .text()
            .trim();

        // Time text (if exists)
        const timeText = item
            .find(".c228_list_item span")
            .first()
            .text()
            .trim();

        let port = portText;
        let country = null;
        let arrival = dayName || null;
        let departure = null;

        // Handle "At Sea"
        if (/at sea/i.test(portText)) {
            port = "Day at sea";
            country = null;
            departure = "00:00 - 00:00";
        } else {
            // Extract country from "City, Country"
            if (portText.includes(",")) {
                const parts = portText.split(",");
                country = parts[parts.length - 1].trim();
                countriesSet.add(country);
            }

            // Time parsing
            if (timeText) {
                // Examples:
                // "07:00 PM Embark"
                // "09:00 AM - 05:00 PM (Tender Port)"
                // "07:00 AM - 11:00 PM"
                const cleanTime = timeText.replace(/\(.*?\)/g, "").trim();

                if (cleanTime.includes("-")) {
                    departure = cleanTime;
                } else {
                    // Embark or single time
                    departure = cleanTime;
                }
            }
        }

        cruiseData.itinerary.push({
            port: port || null,
            country: country,
            arrival: arrival || null,
            departure: departure || null
        });
    });

    // Count only real ports (exclude Day at sea)
    const realPorts = cruiseData.itinerary.filter(i => i.country !== null);
    cruiseData.totalPorts = realPorts.length;
    cruiseData.countries = Array.from(countriesSet);
    cruiseData.totalCountries = cruiseData.countries.length;

    return cruiseData;
}

/**
 * Reusable function to get NCL single cruise data by URL
 * @param {string} cruiseURL
 * @returns {Promise<Object>}
 */
async function getSingleCruiseDataNCL(cruiseURL) {
    try {
        const html = await fetchHTML(cruiseURL);
        const data = extractNclCruiseInfo(html);
        return data;
    } catch (err) {
        console.error("Error fetching NCL cruise data:", err.message);
        return null;
    }
}

// Export function
export { getSingleCruiseDataNCL };
