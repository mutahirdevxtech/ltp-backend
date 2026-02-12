import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fetch HTML from a given URL
 * @param {string} url 
 * @returns {string} HTML content
 */

async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        },
        timeout: 15000,
    });

    return data;
}

/**
 * Extract cruise info from Regent/Silversea HTML
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

    $("tr.c179_table_body_row").each((_, tr) => {
        const detailRow = $(tr).find("table.c179_details tr.c179_details_row");

        const date = detailRow.find(".c179_details_row_cell.-date .e27_item.-primaryInfo span").text().trim() || null;
        const portCity = detailRow.find(".c179_details_row_cell.-port .c179_details_data_item.-port-city span").text().trim() || null;
        let portCountry = detailRow.find(".c179_details_row_cell.-port .c179_details_data_item.-port-country span").text().trim() || null;

        // agar country null hai to "At Sea" assign karo
        if (!portCountry || portCountry === "") {
            portCountry = "At Sea";
        }

        const arrival = detailRow.find(".c179_details_row_cell.-arrive .e27_item.-primaryInfo span").text().trim() || null;
        const departure = detailRow.find(".c179_details_row_cell.-depart .e27_item.-primaryInfo span").text().trim() || null;

        // countries array main duplicate avoid karte hue push karo
        if (portCountry && !cruiseData.countries.includes(portCountry)) cruiseData.countries.push(portCountry);

        cruiseData.itinerary.push({
            date,
            port: portCity ? `${portCity} ${portCountry}` : portCountry,
            country: portCountry,
            arrival,
            departure
        });
    });

    cruiseData.totalPorts = cruiseData.itinerary.length;
    cruiseData.totalCountries = cruiseData.countries.length;

    return cruiseData;
}

/**
 * Reusable function to get cruise info by URL
 * @param {string} cruiseURL 
 * @returns {Promise<Object>} Cruise data JSON
 */
async function getSingleCruiseDataRegent(cruiseURL) {
    try {
        const html = await fetchHTML(cruiseURL);
        const data = extractCruiseInfo(html);
        return data;
    } catch (err) {
        console.error("Error fetching cruise data:", err.message);
        return null;
    }
}

export { getSingleCruiseDataRegent };
