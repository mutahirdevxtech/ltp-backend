import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseShipsController = async (req, res, next) => {
    try {
        // sirf unique ship names laa ke dega
        const ships = await cruiseModel.distinct("ship");

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
