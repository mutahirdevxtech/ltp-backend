import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";

export const getSingleBookingController = async (req, res) => {
    try {
        const { bookingId } = req?.params;

        if (!bookingId) {
            return res.status(400).send({
                message: errorMessages.idIsMissing,
            });
        }

        if (!isValidObjectId(bookingId)) {
            return res.status(400).send({
                message: errorMessages.invalidId,
            });
        }

        const booking = await bookingModel.findById(bookingId).lean().exec();

        if (!booking) {
            return res.status(404).send({
                message: "booking not found",
            });
        }

        return res.send({
            message: "booking fetched successfully",
            data: booking,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message,
        });
    }
};
