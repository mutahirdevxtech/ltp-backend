import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseDestinationsController = async (req, res, next) => {
    try {
        const { ship, origin } = req.query;

        // build dynamic query
        const query = {};
        if (ship) {
            query.ship = ship;
        }

        // sirf title chahiye
        const cruises = await cruiseModel.find(
            query,
            { title: 1, _id: 0 }
        );

        const destinationsSet = new Set();

        cruises.forEach(c => {
            if (c.title && c.title.includes(" to ")) {
                const [from, to] = c.title.split(" to ").map(s => s.trim());

                // agar origin diya hua hai → match karo
                if (origin) {
                    if (from === origin) {
                        destinationsSet.add(to);
                    }
                } else {
                    // agar origin nahi diya → sab "to" add kar do
                    destinationsSet.add(to);
                }
            }
        });

        const destinations = Array.from(destinationsSet);

        return res.send({
            message: "cruise destinations fetched",
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
