import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel, cruiseModel } from "../../../models/index.mjs";
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
            provider,
            userId,
            page = 1,
            limit = 10
        } = req.query;

        // const pageNumber = parseInt(page);
        // const limitNumber = parseInt(limit);
        // const skip = (pageNumber - 1) * limitNumber;
        // const skip = pageNumber - 1;

        const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
        const limitNumber = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const skip = (pageNumber - 1) * limitNumber;

        const query = { isDeleted: false };

        if (userId) {
            query.userId = userId;
        }

        // ------------------------------
        // Date Filters → createdAt
        // ------------------------------
        if (startCreatedAt && endCreatedAt) {
            query.createdAt = {
                $gte: moment(startCreatedAt, "DD-MM-YYYY").startOf("day").toDate(),
                $lte: moment(endCreatedAt, "DD-MM-YYYY").endOf("day").toDate()
            };
        }

        // ------------------------------
        // Date Filters → updatedAt
        // ------------------------------
        if (startUpdatedAt && endUpdatedAt) {
            query.updatedAt = {
                $gte: moment(startUpdatedAt, "DD-MM-YYYY").startOf("day").toDate(),
                $lte: moment(endUpdatedAt, "DD-MM-YYYY").endOf("day").toDate()
            };
        }

        // ------------------------------
        // Date Filters → departureDate
        // ------------------------------
        if (startDepartureDate && endDepartureDate) {
            query.departureDate = {
                $gte: moment(startDepartureDate, "DD-MM-YYYY").startOf("day").toDate(),
                $lte: moment(endDepartureDate, "DD-MM-YYYY").endOf("day").toDate()
            };
        }

        // ------------------------------
        // Provider Filter
        // ------------------------------
        if (provider) {
            query.provider = provider;
        }

        // ------------------------------
        // Search Filter
        // ------------------------------
        if (q) {
            const regex = new RegExp(escapeRegExp(q), "i");
            query.$or = [
                { origin: regex },
                { destination: regex },
            ];
        }

        // ------------------------------
        // Total Count (before pagination)
        // ------------------------------
        const total = await bookingModel.countDocuments(query);

        // ------------------------------
        // Fetch Paginated Bookings
        // ------------------------------
        const bookings = await bookingModel
            .find(query)
            .select("-updatedAt -isDeleted")
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limitNumber)
            .populate({
                path: "userId",
                select: "firstName lastName email"
            })
            .lean()
            .exec();

        // ------------------------------
        // Fetch Related Cruises (Optimized)
        // ------------------------------
        const cruiseLinks = [
            ...new Set(
                bookings
                    .map(b => b.cruiseLink)
                    .filter(Boolean)
            )
        ];

        const cruises = await cruiseModel.find({
            link: { $in: cruiseLinks }
        })
            .select("-createdAt -updatedAt -isDeleted -__v")
            .lean();

        const cruiseMap = {};
        cruises.forEach(c => {
            cruiseMap[c.link] = c;
        });

        const bookingsWithCruise = bookings.map(b => ({
            ...b,
            cruiseData: b.cruiseLink
                ? cruiseMap[b.cruiseLink] || null
                : null
        }));

        // ------------------------------
        // Final Response
        // ------------------------------
        const totalPages = Math.max(Math.ceil(total / limitNumber), 1);
        return res.send({
            message: "bookings fetched successfully",
            total,
            // totalPages: Math.ceil(total / limitNumber),
            totalPages: totalPages,
            currentPage: pageNumber,
            data: bookingsWithCruise,
            hasNextPage: pageNumber < totalPages,
            hasPrevPage: pageNumber > 1,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message,
        });
    }
};
