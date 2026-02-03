import { errorMessages } from "../../../utils/errorMessages.mjs";
import { loginHistoryModel } from "../../../models/index.mjs"

export const getLoginHistoryController = async (req, res, next) => {
    try {
        const query = { isExpired: false, _id: { $ne: req?.currentUser?.loginHistoryId } }

        const loginHistory = await loginHistoryModel.find(query)
            .sort({ _id: -1 })

        return res.send({
            message: "login history fetched",
            data: loginHistory
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}
