import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel, userModel, cruiseModel } from "../../../models/index.mjs";

export const getAdminAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req?.query;

        // 🔥 Build Booking Date Filter
        const bookingMatch = { isDeleted: false };

        if (startDate || endDate) {
            bookingMatch.createdAt = {};
            if (startDate) {
                bookingMatch.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                bookingMatch.createdAt.$lte = new Date(endDate);
            }
        }

        // 1️⃣ Total Bookings (Date Filtered)
        const totalBookings = await bookingModel.countDocuments(bookingMatch);

        // 2️⃣ Total Customers (optional date filter bhi laga sakte ho)
        const customerMatch = {
            isDeleted: false,
            role: "CUSTOMER"
        };

        if (startDate || endDate) {
            customerMatch.createdAt = {};
            if (startDate) customerMatch.createdAt.$gte = new Date(startDate);
            if (endDate) customerMatch.createdAt.$lte = new Date(endDate);
        }

        const totalCustomers = await userModel.countDocuments(customerMatch);

        // 3️⃣ Total Pending (Date Filtered)
        const totalPendingBookings = await bookingModel.countDocuments({
            ...bookingMatch,
            status: "PENDING"
        });

        // 4️⃣ Upcoming 3 Cruises (Future Only)
        const upcomingDepartures = await cruiseModel
            .find({ startDate: { $gte: new Date() } })
            .sort({ startDate: 1 })
            .limit(3)
            .select("title startDate provider image");

        // 5️⃣ Latest Customers (Date Filtered)
        const latestCustomers = await userModel
            .find(customerMatch)
            .sort({ _id: -1 })
            .limit(3)
            .select("firstName lastName email createdAt");

        // 6️⃣ Top Active Customers (Date Filtered)
        const topActiveCustomers = await bookingModel.aggregate([
            { $match: bookingMatch },
            {
                $group: {
                    _id: "$userId",
                    totalBookings: { $sum: 1 }
                }
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    totalBookings: 1,
                    "user.firstName": 1,
                    "user.lastName": 1,
                    "user.email": 1
                }
            }
        ]);

        // 7️⃣ Providers Pie Chart (Date Filtered)
        const providersBookingsChartData = await bookingModel.aggregate([
            { $match: bookingMatch },
            {
                $lookup: {
                    from: "cruises",
                    localField: "cruiseLink",
                    foreignField: "link",
                    as: "cruise"
                }
            },
            { $unwind: "$cruise" },
            {
                $group: {
                    _id: "$cruise.provider",
                    totalBookings: { $sum: 1 }
                }
            },
            {
                $project: {
                    provider: "$_id",
                    totalBookings: 1,
                    _id: 0
                }
            }
        ]);

        // 8️⃣ Revenue Bar Chart (Dummy Revenue Per Provider)
        const revenueChartDataByCompany = providersBookingsChartData.map(p => ({
            provider: p.provider,
            revenue: p.totalBookings * 1000
        }));

        return res.send({
            message: "analytics fetched",
            data: {
                totalBookings,
                totalCustomers,
                totalPendingBookings,
                upcomingDepartures,
                latestCustomers,
                topActiveCustomers,
                providersBookingsChartData,
                revenueChartDataByCompany
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
