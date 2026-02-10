import axios from "axios";

/**
 * Extract Azamara single cruise itinerary in Silversea-style format
 * @param {string} seawareId - e.g. "b11f9479-433a-4660-b1cd-48ccd8d9b19b"
 * @returns {Promise<Object>} JSON with totalPorts, totalCountries, countries, itinerary
 */
async function getSingleCruiseDataAzamara(seawareId) {
    const url = `https://www.azamara.com/api/1/services/search/get-itinerary-cached.json?siteId=azamara&cruise=${seawareId}&type=full`;

    try {
        const { data } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        const cruiseData = {
            totalPorts: 0,
            totalCountries: 0,
            countries: [],
            itinerary: [],
        };

        if (!data.days || !Array.isArray(data.days)) return cruiseData;

        data.days.forEach((day) => {
            const portCityCountry = day.portCityCountry || "";
            const parts = portCityCountry.split(",");
            const port = parts[0].trim();
            const country = parts[1]?.trim() || null;

            if (country && !cruiseData.countries.includes(country)) {
                cruiseData.countries.push(country);
            }

            // Parse arrival & departure from timingString
            let arrival = null,
                departure = null;
            if (day.timingString) {
                const matchArr = day.timingString.match(/Arrives\s*(\d{1,2}:\d{2}[AP]M\s*on\s*[A-Za-z]{3}\s*\d{1,2})/i);
                const matchDep = day.timingString.match(/Departs\s*(\d{1,2}:\d{2}[AP]M\s*on\s*[A-Za-z]{3}\s*\d{1,2})/i);

                arrival = matchArr ? matchArr[1] : day.isOvernight ? null : day.timingString.replace(/<.*?>/g, "").trim();
                departure = matchDep ? matchDep[1] : null;
            }

            cruiseData.itinerary.push({
                port: port,
                country: country,
                arrival: arrival || null,
                departure: departure || null,
            });
        });

        cruiseData.totalPorts = cruiseData.itinerary.length;
        cruiseData.totalCountries = cruiseData.countries.length;

        return cruiseData;
    } catch (err) {
        console.error("Error fetching Azamara cruise data:", err.message);
        return null;
    }
}

export { getSingleCruiseDataAzamara };
