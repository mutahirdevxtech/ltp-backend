import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruisePortsController = async (req, res, next) => {
    try {
        return res.send({
            message: "cruise ports fetched",
            data: []
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}
