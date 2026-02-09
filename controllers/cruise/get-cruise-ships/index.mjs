import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseShipsController = async (req, res, next) => {
    try {
        const { provider } = req?.query

        let filter = {};
        if (provider) filter.provider = provider.toUpperCase()
        const ships = await cruiseModel.distinct("ship", filter);
        return res.send({
            message: "cruise ships fetched",
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
