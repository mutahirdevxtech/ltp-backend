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
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        // simple string filters
        if (provider) filter.provider = provider;
        if (ship) filter.ship = ship;
        if (price) filter.price = { $regex: price, $options: "i" };

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

        // origin/destination DB-level regex filter
        if (origin || destination) {
            const originPattern = origin ? origin.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : '';
            const destPattern = destination ? destination.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : '';

            if (origin && destination) {
                filter.title = { $regex: new RegExp(`^.*${originPattern}.* to .*${destPattern}.*$`, 'i') };
            } else if (origin) {
                filter.title = { $regex: new RegExp(`^.*${originPattern}.* to .*`, 'i') };
            } else if (destination) {
                filter.title = { $regex: new RegExp(`^.* to .*${destPattern}.*$`, 'i') };
            }
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // total count after DB filter
        let total = await cruiseModel.countDocuments(filter);
        let cruises = await cruiseModel
            .find(filter)
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(limitNum);

        // If no cruises found, fetch next upcoming cruises only
        if (total === 0 && startDateFrom) {
            const nextCruiseFilter = { ...filter, startDate: { $gte: new Date(startDateFrom) } };

            cruises = await cruiseModel
                .find(nextCruiseFilter)
                .sort({ startDate: 1 }) // earliest upcoming first
                .limit(limitNum);

            total = cruises.length;
        }

        return res.send({
            message: total === 0 ? "No cruises found for given date, showing next available cruises" : "Cruise data fetched",
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
