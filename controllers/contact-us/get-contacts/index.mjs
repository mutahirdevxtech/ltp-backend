import { errorMessages } from "../../../utils/errorMessages.mjs";
import { contactUsModel } from "../../../models/index.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";
import moment from "moment";

export const getAllContactUs = async (req, res) => {
    try {
        const {
            q,
            isDeleted,
            startCreatedAt,
            endCreatedAt,
            startUpdatedAt,
            endUpdatedAt,
            page: skip = 0,
            limit = 10,
        } = req.query;

        let query = {};

        // ------------------------------
        // Date Filters → createdAt
        // ------------------------------
        if (startCreatedAt && endCreatedAt) {
            const isoStart = moment(startCreatedAt, "DD-MM-YYYY").startOf("day").toDate();
            const isoEnd = moment(endCreatedAt, "DD-MM-YYYY").endOf("day").toDate();
            query.createdAt = { $gte: isoStart, $lte: isoEnd };
        }

        // ------------------------------
        // Date Filters → updatedAt
        // ------------------------------
        if (startUpdatedAt && endUpdatedAt) {
            const isoStart = moment(startUpdatedAt, "DD-MM-YYYY").startOf("day").toDate();
            const isoEnd = moment(endUpdatedAt, "DD-MM-YYYY").endOf("day").toDate();
            query.updatedAt = { $gte: isoStart, $lte: isoEnd };
        }

        // ------------------------------
        // isDeleted filter
        // ------------------------------
        if (isDeleted != null) {
            query.isDeleted = isDeleted === "true";
        }

        // ------------------------------
        // Search filter
        // ------------------------------
        if (q) {
            const regex = new RegExp(escapeRegExp(q), "i");
            query.$or = [
                { title: regex },
                { fullName: regex },
                { email: regex }
            ];
        }

        const parsedSkip = parseInt(skip) || 0;
        const parsedLimit = parseInt(limit) || 10;

        const [data, totalRecords] = await Promise.all([
            contactUsModel
                .find(query)
                .sort({ _id: -1 })
                .skip(parsedSkip)
                .limit(parsedLimit)
                .lean()
                .exec(),
            contactUsModel.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalRecords / parsedLimit);
        const currentPage = Math.floor(parsedSkip / parsedLimit) + 1;

        return res.send({
            message: "contact requests fetched successfully",
            pagination: {
                totalRecords,
                totalPages,
                currentPage,
                limit: parsedLimit,
                skip: parsedSkip,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            },
            data
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};