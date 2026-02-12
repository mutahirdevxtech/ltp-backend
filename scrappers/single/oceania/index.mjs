import axios from "axios";

/**
 * Fetch all Oceania cruises using optimized pagination
 * Transform data to standard format
 * @returns {Promise<Object>} Transformed cruise data
 */
async function getAllOceaniaCruises() {
    console.log("funciton called ")
    const baseURL = "https://www.oceaniacruises.com/api/cruise-details/v1/cruises";
    const pageSize = 150;
    let page = 1;
    let totalPages = 1;
    let allCruisesRaw = [];

    try {
        // Fetch all pages
        while (page <= totalPages) {
            const url = `${baseURL}?filters=duration%7Ctime_frame%7Cnot:port%7Cport%7Cship%7Cmarketing_region&sort=featured:desc&page=${page}&pageSize=${pageSize}`;

            const { data } = await axios.get(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!data?.results) break;
            allCruisesRaw.push(...data.results);

            if (page === 1) {
                const totalRecords = data.pagination?.totalRecords || 0;
                totalPages = Math.ceil(totalRecords / pageSize);
            }

            page++;
        }

        // Transform data
        const transformedCruises = allCruisesRaw.map((c) => ({
            title: c.voyageName || "N/A",
            ship: c.shipName || "N/A",
            startDate: c.embarkDate || "N/A",
            endDate: c.debarkDate || "N/A",
            duration: c.duration ? `${c.duration} DAYS` : "N/A",
            price: c.faresFrom || "N/A",
            link: c.detailsURL ? `https://www.oceaniacruises.com${c.detailsURL}` : "N/A",
            image: c.image?.src ? `https://www.oceaniacruises.com${c.image.src}` : null,
            provider: "OCEANIA"
        }));

        const obj = {
            totalCruises: transformedCruises.length,
            scrapedAt: new Date().toISOString(),
            cruises: transformedCruises
        };
        return obj;
    } catch (error) {
        console.error("Oceania fetch error:", error.message);
        return null;
    }
}

export { getAllOceaniaCruises };
