import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseShipsController = async (req, res, next) => {
    try {
        const { provider } = req?.query;

        let filter = {};
        if (provider) filter.provider = provider.toUpperCase();

        // fetch all ships arrays
        const shipsArrays = await cruiseModel.find(filter, { ship: 1, _id: 0 });

        // flatten arrays and remove duplicates
        const ships = [...new Set(shipsArrays.flatMap(item => item.ship))].sort((a, b) =>
            a.localeCompare(b)
        );

        return res.send({
            message: "Cruise ships fetched",
            data: ships
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
