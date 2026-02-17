import { errorMessages } from "../../../utils/errorMessages.mjs"
import { userModel } from "../../../models/index.mjs"
import { escapeRegExp } from "../../../utils/functions.mjs"
import moment from "moment"

export const getBulkUsersController = async (req, res, next) => {
    try {
        const {
            isEmailVerified,
            role,
            q,
            status,
            isDeleted,
            startJoiningDate,
            endJoiningDate,
            startUpdatingDate,
            endUpdatingDate,
            page: skip = 0,
            limit = 10
        } = req?.query

        let query = {}

        // 🔹 Date Filters
        if (startJoiningDate && endJoiningDate) {
            const isoStartJoiningDate = moment(startJoiningDate, "DD-MM-YYYY").startOf("day").toDate()
            const isoEndJoiningDate = moment(endJoiningDate, "DD-MM-YYYY").endOf("day").toDate()
            query.createdOn = { $gte: isoStartJoiningDate, $lte: isoEndJoiningDate }
        }

        if (startUpdatingDate && endUpdatingDate) {
            const isoStartUpdatingDate = moment(startUpdatingDate, "DD-MM-YYYY").startOf("day").toDate()
            const isoEndUpdatingDate = moment(endUpdatingDate, "DD-MM-YYYY").endOf("day").toDate()
            query.updatedAt = { $gte: isoStartUpdatingDate, $lte: isoEndUpdatingDate }
        }

        // 🔹 Boolean Filters
        if (isEmailVerified != null) query.isEmailVerified = isEmailVerified === "true"
        if (isDeleted != null) query.isDeleted = isDeleted === "true"

        // 🔹 Other Filters
        if (role) query.role = role?.toUpperCase()
        if (status) query.status = status?.toUpperCase()

        // 🔹 Search
        if (q) {
            const regex = new RegExp(escapeRegExp(q), "i")
            query.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
            ]
        }

        // 🔹 Pagination values
        const parsedSkip = Math.max(0, parseInt(skip) || 0)
        const parsedLimit = Math.max(1, parseInt(limit) || 10)

        // 🔹 Total Count
        const totalUsers = await userModel.countDocuments(query)

        // 🔹 Data Fetch
        const users = await userModel.find(query)
            .sort({ _id: -1 })
            .skip(parsedSkip)
            .limit(parsedLimit)
            .select("-password -isDeleted -updatedAt -pushNotifications -is2faEnabled -__v")
            .exec()

        return res.send({
            message: "Users fetched successfully",
            data: {
                totalUsers,
                skip: parsedSkip,
                limit: parsedLimit,
                users
            }
        })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}
