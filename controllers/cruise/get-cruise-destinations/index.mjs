import { errorMessages } from "../../../utils/errorMessages.mjs";
import { cruiseData } from "../../../data/data.mjs"

export const getCruiseDestinationsController = async (req, res, next) => {
    try {
        const data = cruiseData.itinerary.map((i) => {
            return {
                name: i?.name,
                id: i?.portid
            }
        })

        return res.send({
            message: "cruise data fetched",
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
