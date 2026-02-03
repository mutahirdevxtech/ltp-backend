import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getAdminAnalytics = async (req, res, next) => {
    try {
        return res.send({
            message: "analytics fetched",
            data: {}
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
