import { errorMessages } from "../../../utils/errorMessages.mjs";
import { } from "../../../models/index.mjs";

export const getSingleBookingController = async (req, res) => {
    try {

        return res.send({
            message: "booking fetched successfully",
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
