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
            endUpdatedAt
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
        // Searching → title, fullName, email
        // ------------------------------
        if (q) {
            const regex = new RegExp(escapeRegExp(q), "i");
            query.$or = [
                { title: regex },
                { fullName: regex },
                { email: regex }
            ];
        }

        // ------------------------------
        // Fetch data
        // ------------------------------
        const resp = await contactUsModel
            .find(query)
            .sort({ _id: -1 })
            .lean()
            .exec();

        return res.send({
            message: "contact requests fetched successfully",
            data: resp
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};
