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
 * Extract cruise info from HTML
 * @param {string} html 
 * @returns {Object} cruise data
 */
function extractCruiseInfo(html) {
    const $ = cheerio.load(html);

    const cruiseData = {
        totalPorts: 0,
        totalCountries: 0,
        countries: [],
        itinerary: []
    };

    // ----- Extract total ports and countries -----
    $("ul.DescriptionTextColumn-module_highlights__sOp1v li").each((i, li) => {
        const text = $(li).text().trim();
        if (text.includes("Ports")) {
            const match = text.match(/\d+/);
            if (match) cruiseData.totalPorts = parseInt(match[0]);
        }
        if (text.includes("Countries")) {
            const match = text.match(/\d+/);
            if (match) cruiseData.totalCountries = parseInt(match[0]);
        }
    });

    // ----- Extract itinerary -----
    $("div[data-content-name='section_itinerary'] .CruiseItineraryPortItem-module--item--8fb5a").each((i, div) => {
        const portName = $(div)
            .find(".CruiseItineraryPortItem-module--stop-name--a06c7, .CruiseItineraryPortItem-module--stop-name-inline--7b255")
            .first()
            .text()
            .trim()
            .replace(/\s*,\s*/, ", ");

        const country = portName.includes(",") ? portName.split(",")[1].trim() : null;
        if (country && !cruiseData.countries.includes(country)) {
            cruiseData.countries.push(country);
        }

        const arrival = $(div).find("time").first().text().trim();
        const departure = $(div).find(".CruiseItineraryPortItem-module--date-time-label--2c19e div").first().text().trim();

        cruiseData.itinerary.push({
            port: portName,
            country: country,
            arrival: arrival || null,
            departure: departure || null
        });
    });

    return cruiseData;
}

/**
 * Reusable function to get cruise info by URL
 * @param {string} cruiseURL 
 * @returns {Promise<Object>} Cruise data JSON
 */
async function getSingleCruiseData(cruiseURL) {
    try {
        const html = await fetchHTML(cruiseURL);
        const data = extractCruiseInfo(html);
        return data;
    } catch (err) {
        console.error("Error fetching cruise data:", err.message);
        return null;
    }
}


export { getSingleCruiseData }
