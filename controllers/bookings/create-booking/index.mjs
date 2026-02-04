import { errorMessages } from "../../../utils/errorMessages.mjs";
import {  } from "../../../models/index.mjs";

export const createBookingController = async (req, res) => {
    try {

        return res.send({
            message: "booking created successfully",
            data: null
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};
