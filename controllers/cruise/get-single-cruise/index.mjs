import { isValidObjectId } from "mongoose";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { cruiseModel } from "../../../models/index.mjs";
import { getSingleCruiseData } from "../../../scrappers/index.mjs"

export const getSingleCruiseDataController = async (req, res, next) => {
    try {
        const { cruiseId } = req?.params

        if (!cruiseId) {
            return res.status(400).send({
                message: errorMessages.idIsMissing
            })
        }

        if (!isValidObjectId(cruiseId)) {
            return res.status(400).send({
                message: errorMessages.invalidId
            })
        }

        const cruise = await cruiseModel.findById(cruiseId).exec()

        if (!cruise) {
            return res.status(400).send({
                message: "cruise not found"
            })
        }

        var cruise_details = null

        if (cruise?.link) {
            cruise_details = await getSingleCruiseData(cruise?.link)
        }

        let data = { ...cruise_details, ...cruise?.toObject() }

        return res.send({
            message: "single cruise data fetched",
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
