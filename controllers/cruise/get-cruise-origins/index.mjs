import { cruiseModel } from "../../../models/index.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getCruiseOriginsController = async (req, res, next) => {
    try {
        const { ship } = req.query;

        // if (!ship) {
        //     return res.status(400).send({
        //         message: "ship is required in query"
        //     });
        // }


        const query = {}

        if (ship) {
            query.ship = ship
        }

        // ship ke saare titles nikaal lo
        const cruises = await cruiseModel.find(
            query,
            { title: 1, _id: 0 }
        );

        // "A to B" se A (origin) nikaal ke unique bana do
        const originsSet = new Set();

        cruises.forEach(c => {
            if (c.title && c.title.includes(" to ")) {
                const origin = c.title.split(" to ")[0].trim();
                originsSet.add(origin);
            }
        });

        const origins = Array.from(originsSet);

        return res.send({
            message: "cruise origins fetched",
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
