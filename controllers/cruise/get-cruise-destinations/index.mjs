import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";

export const getCruiseDestinationsController = async (req, res) => {
    try {
        const { ship, origin } = req.query;

        const query = {};

        // ✅ Case-insensitive ship search
        if (ship) {
            query.ship = {
                $elemMatch: {
                    $regex: new RegExp(`^${escapeRegExp(ship)}$`, "i")
                }
            };
        }

        // ✅ Case-insensitive origin filter
        if (origin) {
            query.title = {
                $regex: new RegExp(
                    `^${escapeRegExp(origin)}\\s+to\\s+`,
                    "i"
                )
            };
        }

        // Only fetch title (performance optimization)
        const cruises = await cruiseModel
            .find(query, { title: 1, _id: 0 })
            .lean();

        // ✅ Unique + Uppercase Destinations
        const destinationsSet = new Set();

        cruises.forEach(c => {
            if (c.title && c.title.includes(" to ")) {
                const destination = c.title
                    .split(" to ")[1]   // 👈 destination part
                    .trim()
                    .toUpperCase();

                destinationsSet.add(destination);
            }
        });

        const destinations = Array.from(destinationsSet)
            .sort((a, b) => a.localeCompare(b));

        return res.send({
            message: "Cruise destinations fetched",
            data: destinations
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};