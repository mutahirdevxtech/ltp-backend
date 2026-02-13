// index.mjs
import axios from "axios";
import { format, parseISO } from "date-fns";

// Helper function to format date like "Apr 11"
function formatDate(dateString) {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return format(date, "MMM d");
}

// Helper function to format arrival/departure
function formatTime(dateString, type) {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return format(date, "h:mm a");
}

// Main function with voyageId as parameter
async function getSingleCruiseDataRitzCarlton(link) {
    const voyageId = link.match(/-(\d+)$/)[1];
    const url = `https://apica.ritzcarltonyachtcollection.com/rcyc-yachtsearch/api/voyage/itineraries?voyageId=${voyageId}`;

    try {
        const { data: res } = await axios.get(url);
        if (res.code !== 200) throw new Error("API returned error");

        const countriesSet = new Set();
        const itinerary = res.data.map((item) => {
            if (item.countryName) countriesSet.add(item.countryName);

            let arrival = null;
            let departure = null;

            if (item.dayType === "Departure") {
                arrival = "Embark 1 PM";
                departure = formatTime(item.departureTime, "departure");
            } else if (item.dayType === "Arrival") {
                arrival = formatTime(item.arrivalTime, "arrival");
                departure = "Disembark 8 AM";
            } else if (item.dayType === "Port Day") {
                arrival = formatTime(item.arrivalTime, "arrival");
                departure = formatTime(item.departureTime, "departure");
            } else if (item.dayType === "Sea Day") {
                arrival = null;
                departure = null;
            }

            return {
                date: formatDate(item.date),
                port: item.portName,
                country: item.countryName,
                arrival,
                departure,
            };
        });

        const result = {
            totalPorts: itinerary.length,
            totalCountries: countriesSet.size,
            countries: Array.from(countriesSet),
            itinerary,
        };

        return result;
    } catch (err) {
        console.error("Error fetching Ritz cruise data:", err.message);
        return null;
    }
}

export { getSingleCruiseDataRitzCarlton }
