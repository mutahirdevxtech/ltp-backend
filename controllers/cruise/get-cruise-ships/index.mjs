import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";

export const getCruiseShipsController = async (req, res) => {
    try {
        const { provider, origin, destination } = req.query;

        const matchStage = {};

        // ✅ Provider (case-insensitive)
        if (provider?.trim()) {
            matchStage.provider = {
                $regex: new RegExp(
                    `^${escapeRegExp(provider.trim())}$`,
                    "i"
                )
            };
        }

        // ✅ Origin / Destination (safe + case-insensitive)
        if (origin || destination) {
            const escapedOrigin = origin?.trim()
                ? escapeRegExp(origin.trim())
                : null;

            const escapedDestination = destination?.trim()
                ? escapeRegExp(destination.trim())
                : null;

            if (escapedOrigin && !escapedDestination) {
                matchStage.title = {
                    $regex: new RegExp(
                        `^${escapedOrigin}\\s+to`,
                        "i"
                    )
                };
            }

            if (!escapedOrigin && escapedDestination) {
                matchStage.title = {
                    $regex: new RegExp(
                        `to\\s+${escapedDestination}$`,
                        "i"
                    )
                };
            }

            if (escapedOrigin && escapedDestination) {
                matchStage.title = {
                    $regex: new RegExp(
                        `^${escapedOrigin}\\s+to\\s+${escapedDestination}$`,
                        "i"
                    )
                };
            }
        }

        // 🔥 Aggregation (Fully Optimized)
        const ships = await cruiseModel.aggregate([
            { $match: matchStage },

            // unwind ship array
            { $unwind: "$ship" },

            // normalize to uppercase at DB level
            {
                $group: {
                    _id: { $toUpper: "$ship" }
                }
            },

            { $sort: { _id: 1 } },

            {
                $project: {
                    _id: 0,
                    ship: "$_id"
                }
            }
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