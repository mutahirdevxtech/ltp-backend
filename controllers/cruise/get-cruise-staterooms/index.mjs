import { errorMessages } from "../../../utils/errorMessages.mjs";
import { cruiseData } from "../../../data/data.mjs"

export const getCruiseStateRoomsController = async (req, res, next) => {
    try {
        const data = Object.keys(cruiseData.cabins).map((p) => {
            return {
                name: cruiseData.cabins[p].name,
                id: p
            }
        })

        return res.send({
            message: "cruise staterooms fetched",
            data: data
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}
