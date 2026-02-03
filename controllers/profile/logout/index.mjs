import { loginHistoryModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import moment from "moment"

export const logoutController = async (req, res, next) => {
    try {
        const { loginHistoryId } = req?.currentUser

        if (loginHistoryId) {
            const loginHistory = await loginHistoryModel.findById(loginHistoryId).exec()
            if (loginHistory) {
                const createdAt = moment(loginHistory.createdAt);
                const currentTime = moment();
                const differenceInMilliseconds = currentTime.diff(createdAt);
                loginHistory.sessionDurationInMs = differenceInMilliseconds
                await loginHistory.save()
            }
        }

        res.clearCookie("hart")
        res.clearCookie("hartRef")
        return res.send({
            message: "logout successfull"
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}