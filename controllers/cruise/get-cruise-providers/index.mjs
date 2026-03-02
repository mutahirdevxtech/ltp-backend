import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";

export const getCruiseProvidersController = async (req, res) => {
    try {
        const { origin, destination } = req.query;

        const filter = {};

        const safeOrigin = origin?.trim()
            ? escapeRegExp(origin.trim())
            : null;

        const safeDestination = destination?.trim()
            ? escapeRegExp(destination.trim())
            : null;

        // ✅ Build regex condition safely
        if (safeOrigin && !safeDestination) {
            filter.title = {
                $regex: new RegExp(`^${safeOrigin}\\s+to`, "i")
            };
        }

        if (!safeOrigin && safeDestination) {
            filter.title = {
                $regex: new RegExp(`to\\s+${safeDestination}$`, "i")
            };
        }

        if (safeOrigin && safeDestination) {
            filter.title = {
                $regex: new RegExp(
                    `^${safeOrigin}\\s+to\\s+${safeDestination}$`,
                    "i"
                )
            };
        }

        // ✅ DB-level distinct
        const rawProviders = await cruiseModel.distinct(
            "provider",
            filter
        );

        // ✅ Normalize (uppercase) + unique (case-insensitive dedupe)
        const providersSet = new Set();

        for (const provider of rawProviders) {
            if (!provider) continue;
            providersSet.add(provider.trim().toUpperCase());
        }

        const providers = [...providersSet].sort((a, b) =>
            a.localeCompare(b)
        );

        return res.send({
            message: "Cruise providers fetched",
            data: providers
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};