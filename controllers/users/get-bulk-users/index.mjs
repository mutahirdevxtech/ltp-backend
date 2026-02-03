import { errorMessages } from "../../../utils/errorMessages.mjs"
import { userModel } from "../../../models/index.mjs"
import { escapeRegExp } from "../../../utils/functions.mjs"
import moment from "moment"

export const getBulkUsersController = async (req, res, next) => {
    try {
        const {
            isEmailVerified,
            isPhoneNumberVerified, isPhoneNumberHomeVerified, role,
            q, status, isDeleted,
            startJoiningDate, endJoiningDate, startUpdatingDate, endUpdatingDate,
            country, state, city
        } = req?.query

        let query = {}

        if (startJoiningDate && endJoiningDate) {
            const isoStartJoiningDate = moment(startJoiningDate, "DD-MM-YYYY").format();
            const isoEndJoiningDate = moment(endJoiningDate, "DD-MM-YYYY").format();
            query.createdOn = { $gte: isoStartJoiningDate, $lte: isoEndJoiningDate };
        }

        if (startUpdatingDate && endUpdatingDate) {
            const isoStartUpdatingDate = moment(startUpdatingDate, "DD-MM-YYYY").format();
            const isoEndUpdatingDate = moment(endUpdatingDate, "DD-MM-YYYY").format();
            query.updatedAt = { $gte: isoStartUpdatingDate, $lte: isoEndUpdatingDate };
        }

        if (isEmailVerified != null) query.isEmailVerified = isEmailVerified === "true"
        if (isPhoneNumberVerified != null) query.isPhoneNumberVerified = isPhoneNumberVerified === "true"
        if (isPhoneNumberHomeVerified != null) query.isPhoneNumberHomeVerified = isPhoneNumberHomeVerified === "true"
        if (role) query.role = role?.toUpperCase()
        if (status) query.status = status?.toUpperCase()
        if (isDeleted != null) query.isDeleted = isDeleted === "true"
        if (country && country?.trim() !== "") query["address.country"] = country?.trim()
        if (state && state?.trim() !== "") query["address.state"] = state?.trim()
        if (city && city?.trim() !== "") query["address.city"] = city?.trim()

        if (q) {
            const regex = new RegExp(escapeRegExp(q), 'i')
            query.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { phoneNumber: regex },
                { phoneNumberHome: regex },
            ]
        }

        const users = await userModel.find(query)
            .sort({ _id: -1 })
            .exec()

        return res.send({
            message: "Users fetched successfully",
            data: { users: users }
        })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}
