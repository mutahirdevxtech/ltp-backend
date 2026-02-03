import { errorMessages } from "../../../utils/errorMessages.mjs";
import { cruiseData } from "../../../data/data.mjs"

export const getCruisePortsController = async (req, res, next) => {
    try {
        const data = Object.keys(cruiseData.ports).map((p) => {
            return {
                name: cruiseData.ports[p],
                id: p
            }
        })

        return res.send({
            message: "cruise ports fetched",
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
