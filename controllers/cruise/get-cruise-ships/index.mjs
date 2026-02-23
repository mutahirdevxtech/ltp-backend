import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";

export const getCruiseShipsController = async (req, res) => {
    try {
        const { provider, origin, destination } = req.query;

        let matchStage = {};

        // 🔹 Provider filter
        if (provider) {
            matchStage.provider = provider.toUpperCase();
        }

        // 🔹 Origin/Destination filter (based on title: "BOSTON to QUEBEC")
        if (origin || destination) {

            const escapedOrigin = origin ? escapeRegExp(origin) : null;
            const escapedDestination = destination ? escapeRegExp(destination) : null;

            if (origin && !destination) {
                matchStage.title = new RegExp(`^${escapedOrigin}\\s+to`, "i");
            }

            if (!origin && destination) {
                matchStage.title = new RegExp(`to\\s+${escapedDestination}$`, "i");
            }

            if (origin && destination) {
                matchStage.title = new RegExp(
                    `^${escapedOrigin}\\s+to\\s+${escapedDestination}$`,
                    "i"
                );
            }
        }

        // 🔥 Aggregation (DB level unique ships)
        const ships = await cruiseModel.aggregate([
            { $match: matchStage },
            { $unwind: "$ship" },
            { $group: { _id: "$ship" } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, ship: "$_id" } }
        ]);

        return res.send({
            message: "Cruise ships fetched",
            data: ships.map(s => s.ship)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
