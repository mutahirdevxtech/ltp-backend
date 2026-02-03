import { errorMessages } from "../../../utils/errorMessages.mjs";
import { cruiseData } from "../../../data/data.mjs"

export const getCruiseDataController = async (req, res, next) => {
    try {

        return res.send({
            message: "cruise data fetched",
            data: cruiseData
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}
