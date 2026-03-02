import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";

export const getCruiseDataController = async (req, res) => {
    try {
        const {
            provider,
            ship,
            startDateFrom,
            startDateTo,
            endDateFrom,
            endDateTo,
            origin,
            destination,
            price,
            page = 1,
            limit = 10,
            minDays,
            maxDays,
        } = req.query;

        const filter = {};

        // -------------------------
        // Duration filter (minDays / maxDays)
        // -------------------------
        if (minDays || maxDays) {
            const durationNumber = {
                $toInt: { $arrayElemAt: [{ $split: ["$duration", " "] }, 0] }
            };
            const conditions = [];
            if (minDays) conditions.push({ $gte: [durationNumber, Number(minDays)] });
            if (maxDays) conditions.push({ $lte: [durationNumber, Number(maxDays)] });
            filter.$expr = { $and: conditions };
        }

        // -------------------------
        // Provider / Ship filters (case-insensitive)
        // -------------------------
        if (provider?.trim()) {
            filter.provider = {
                $regex: new RegExp(`^${escapeRegExp(provider.trim())}$`, "i")
            };
        }

        if (ship?.trim()) {
            filter.ship = {
                $elemMatch: {
                    $regex: new RegExp(`^${escapeRegExp(ship.trim())}$`, "i")
                }
            };
        }

        // -------------------------
        // Price filter (case-insensitive regex)
        // -------------------------
        if (price?.trim()) {
            filter.price = { $regex: escapeRegExp(price.trim()), $options: "i" };
        }

        // -------------------------
        // Date filters
        // -------------------------
        if (startDateFrom || startDateTo) {
            filter.startDate = {};
            if (startDateFrom) filter.startDate.$gte = new Date(startDateFrom);
            if (startDateTo) filter.startDate.$lte = new Date(startDateTo);
        }

        if (endDateFrom || endDateTo) {
            filter.endDate = {};
            if (endDateFrom) filter.endDate.$gte = new Date(endDateFrom);
            if (endDateTo) filter.endDate.$lte = new Date(endDateTo);
        }

        // -------------------------
        // Origin / Destination (case-insensitive, safe regex)
        // -------------------------
        if (origin || destination) {
            const originPattern = origin ? escapeRegExp(origin.trim()) : '';
            const destPattern = destination ? escapeRegExp(destination.trim()) : '';

            if (origin && destination) {
                filter.title = {
                    $regex: new RegExp(`^.*${originPattern}.* to .*${destPattern}.*$`, "i")
                };
            } else if (origin) {
                filter.title = { $regex: new RegExp(`^.*${originPattern}.* to .*`, "i") };
            } else if (destination) {
                filter.title = { $regex: new RegExp(`^.* to .*${destPattern}.*$`, "i") };
            }
        }

        // -------------------------
        // Pagination
        // -------------------------
        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);
        const skip = (pageNum - 1) * limitNum;

        // -------------------------
        // Count total after filter
        // -------------------------
        let total = await cruiseModel.countDocuments(filter);

        // -------------------------
        // Fetch cruises
        // -------------------------
        let cruises = await cruiseModel
            .find(filter)
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(); // lean() for performance

        // -------------------------
        // Next upcoming cruises fallback
        // -------------------------
        if (total === 0 && startDateFrom) {
            const nextFilter = { ...filter, startDate: { $gte: new Date(startDateFrom) } };
            cruises = await cruiseModel
                .find(nextFilter)
                .sort({ startDate: 1 })
                .limit(limitNum)
                .lean();
            total = cruises.length;
        }

        return res.send({
            // message:
            //     total === 0
            //         ? "No cruises found for given date, showing next available cruises"
            //         : "Cruise data fetched",
            message: "Cruise data fetched",
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            count: cruises.length,
            data: cruises
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};