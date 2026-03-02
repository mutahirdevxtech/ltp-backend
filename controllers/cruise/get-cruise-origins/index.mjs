import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { escapeRegExp } from "../../../utils/functions.mjs";

export const getCruiseOriginsController = async (req, res) => {
    try {
        const { ship } = req.query;

        const query = {};

        // ✅ Case-insensitive ship search (safe regex)
        if (ship) {
            query.ship = {
                $elemMatch: {
                    $regex: new RegExp(
                        `^${escapeRegExp(ship)}$`,
                        "i"
                    )
                }
            };
        }

        // ✅ Fetch only required field + lean for performance
        const cruises = await cruiseModel
            .find(query, { title: 1, _id: 0 })
            .lean();

        // ✅ Unique + Uppercase Origins
        const originsSet = new Set();

        for (const c of cruises) {
            if (!c.title) continue;

            const parts = c.title.split(" to ");
            if (parts.length !== 2) continue;

            const origin = parts[0].trim().toUpperCase();
            originsSet.add(origin);
        }

        const origins = [...originsSet].sort((a, b) =>
            a.localeCompare(b)
        );

        return res.send({
            message: "Cruise origins fetched",
            data: origins
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};