import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";

export const getCruiseProvidersController = async (req, res) => {
    try {
        const { origin, destination } = req.query;

        let filter = {};

        // sanitize inputs
        const safeOrigin = origin ? escapeRegExp(origin.trim()) : null;
        const safeDestination = destination ? escapeRegExp(destination.trim()) : null;

        // Case 1: Only origin
        if (safeOrigin && !safeDestination) {
            filter.title = new RegExp(`^${safeOrigin}\\s+to`, "i");
        }

        // Case 2: Only destination
        if (!safeOrigin && safeDestination) {
            filter.title = new RegExp(`to\\s+${safeDestination}$`, "i");
        }

        // Case 3: Both
        if (safeOrigin && safeDestination) {
            filter.title = new RegExp(
                `^${safeOrigin}\\s+to\\s+${safeDestination}$`,
                "i"
            );
        }

        const providers = await cruiseModel.distinct("provider", filter);

        providers.sort((a, b) => a.localeCompare(b));

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
