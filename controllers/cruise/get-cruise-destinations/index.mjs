import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseDestinationsController = async (req, res, next) => {
    try {
        const { ship, origin } = req.query;

        if (!ship || !origin) {
            return res.status(400).send({
                message: "ship and origin are required in query"
            });
        }

        // ship ke cruises nikaal lo
        const cruises = await cruiseModel.find(
            { ship },
            { title: 1, _id: 0 }
        );

        const destinationsSet = new Set();

        cruises.forEach(c => {
            if (c.title && c.title.includes(" to ")) {
                const [from, to] = c.title.split(" to ").map(s => s.trim());

                if (from === origin) {
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
