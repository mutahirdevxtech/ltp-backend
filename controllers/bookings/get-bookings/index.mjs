import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel } from "../../../models/index.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";
import moment from "moment";

export const getBookingsController = async (req, res) => {
    try {
        const {
            startCreatedAt,
            endCreatedAt,
            startUpdatedAt,
            endUpdatedAt,
            startDepartureDate,
            endDepartureDate,
            q,
            provider, // new filter
        } = req.query;

        const query = { isDeleted: false };

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
        // Date Filters → departureDate
        // ------------------------------
        if (startDepartureDate && endDepartureDate) {
            const isoStart = moment(startDepartureDate, "DD-MM-YYYY").startOf("day").toDate();
            const isoEnd = moment(endDepartureDate, "DD-MM-YYYY").endOf("day").toDate();
            query.departureDate = { $gte: isoStart, $lte: isoEnd };
        }

        // ------------------------------
        // Provider Filter
        // ------------------------------
        if (provider) {
            query.provider = provider;
        }

        // ------------------------------
        // Search Filter → origin / destination
        // ------------------------------
        if (q) {
            const regex = new RegExp(escapeRegExp(q), "i");
            query.$or = [
                { origin: regex },
                { destination: regex },
            ];
        }

        // ------------------------------
        // Fetch bookings
        // ------------------------------
        const resp = await bookingModel
            .find(query)
            .sort({ _id: -1 })
            .lean()
            .exec();

        return res.send({
            message: "bookings fetched successfully",
            data: resp,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message,
        });
    }
};
