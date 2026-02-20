import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseOriginsController = async (req, res, next) => {
    try {
        const { ship } = req.query;

        const query = {};

        if (ship) {
            // match if the ship array contains the string from frontend
            query.ship = { $in: [ship] };
        }

        // fetch all cruise titles that match the ship
        const cruises = await cruiseModel.find(
            query,
            { title: 1, _id: 0 }
        );

        // extract unique origins from "A to B" titles
        const originsSet = new Set();

        cruises.forEach(c => {
            if (c.title && c.title.includes(" to ")) {
                const origin = c.title.split(" to ")[0].trim();
                originsSet.add(origin);
            }
        });

        const origins = Array.from(originsSet).sort((a, b) =>
            a.localeCompare(b)
        );

        return res.send({
            message: "Cruise origins fetched",
            data: origins
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
