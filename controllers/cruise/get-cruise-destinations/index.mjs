import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseDestinationsController = async (req, res, next) => {
    try {
        const { ship, origin } = req.query;

        // build dynamic query
        const query = {};
        if (ship) {
            // match if the ship array contains the string from frontend
            query.ship = { $in: [ship] };
        }

        // only need titles
        const cruises = await cruiseModel.find(
            query,
            { title: 1, _id: 0 }
        );

        const destinationsSet = new Set();

        cruises.forEach(c => {
            if (c.title && c.title.includes(" to ")) {
                const [from, to] = c.title.split(" to ").map(s => s.trim());

                // if origin is given → match
                if (origin) {
                    if (from === origin) {
                        destinationsSet.add(to);
                    }
                } else {
                    // if no origin → add all destinations
                    destinationsSet.add(to);
                }
            }
        });

        const destinations = Array.from(destinationsSet).sort((a, b) =>
            a.localeCompare(b)
        );

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
