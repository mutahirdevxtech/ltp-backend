import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseProvidersController = async (req, res) => {
    try {
        const { origin, destination } = req.query;

        let filter = {};

        // Case 1: Only origin
        if (origin && !destination) {
            filter.title = new RegExp(`^${origin}\\s+to`, "i");
        }

        // Case 2: Only destination
        if (!origin && destination) {
            filter.title = new RegExp(`to\\s+${destination}$`, "i");
        }

        // Case 3: Both
        if (origin && destination) {
            filter.title = new RegExp(`^${origin}\\s+to\\s+${destination}$`, "i");
        }

        // Direct unique providers from DB
        const providers = await cruiseModel.distinct("provider", filter);

        providers.sort((a, b) => a.localeCompare(b));

        return res.send({
            message: "Cruise providers fetched",
            data: providers
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: "Server Error",
            error: error.message
        });
    }
};
