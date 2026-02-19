import { errorMessages } from "../../../utils/errorMessages.mjs";
import { cardModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";

export const getAllCardsController = async (req, res) => {
    try {
        const { userId, page: skip = 0, limit = 10 } = req.query;

        if (userId && !isValidObjectId(userId)) {
            return res.status(400).send({ message: "Invalid userId" });
        }

        const query = {};
        if (userId) query.userId = userId;

        // Convert skip & limit to numbers
        const skipNumber = Math.max(parseInt(skip, 10), 0);
        const limitNumber = Math.max(parseInt(limit, 10), 1);

        // Fetch total count for pagination info
        const totalCards = await cardModel.countDocuments(query);

        const resp = await cardModel
            .find(query)
            .sort({ _id: -1 })
            .skip(skipNumber)
            .limit(limitNumber)
            .lean()
            .exec();

        return res.send({
            message: "Cards fetched successfully",
            data: resp,
            pagination: {
                total: totalCards,
                skip: skipNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalCards / limitNumber),
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};