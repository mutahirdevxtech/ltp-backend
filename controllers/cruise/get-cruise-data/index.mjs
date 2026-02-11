import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseDataController = async (req, res, next) => {
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
            page = 1,      // 👈 default page
            limit = 10     // 👈 default limit
            // title
        } = req.query;

        const filter = {};

        // simple string filters
        if (provider) filter.provider = provider;
        if (ship) filter.ship = ship;

        // if (title) {
        //     filter.title = { $regex: title, $options: "i" }; // case-insensitive search
        // }

        if (price) {
            filter.price = { $regex: price, $options: "i" };
        }

        // date range filters
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

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const total = await cruiseModel.countDocuments(filter);

        // fetch from DB
        let cruises = await cruiseModel.find(filter).sort({ startDate: 1 })
            .skip(skip)
            .limit(limitNum);

        // origin / destination filtering (title se nikaal ke)
        if (origin || destination) {
            cruises = cruises.filter(c => {
                if (!c.title || !c.title.includes(" to ")) return false;

                const [from, to] = c.title.split(" to ").map(s => s.trim());

                if (origin && from !== origin) return false;
                if (destination && to !== destination) return false;

                return true;
            });
        }

        return res.send({
            message: "cruise data fetched",
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
