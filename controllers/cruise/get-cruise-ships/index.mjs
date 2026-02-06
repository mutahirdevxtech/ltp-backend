import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseShipsController = async (req, res, next) => {
    try {
        return res.send({
            message: "cruise ships fetched",
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
