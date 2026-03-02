import { isValidObjectId } from "mongoose";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { cruiseModel } from "../../../models/index.mjs";
import {
    getSingleCruiseDataAzamara, getSingleCruiseDataNCL,
    getSingleCruiseDataOceania, getSingleCruiseDataRegent,
    getSingleCruiseDataRitzCarlton, getSingleCruiseDataSilverSea,
    getSingleCruiseDataViking, getSingleCruiseDataVirgin,
    scrapeCarnival, scrapeCelebrity, scrapeCunard, scrapePrincess, scrapeRoyalCaribbean
} from "../../../scrappers/index.mjs"

export const getSingleCruiseDataController = async (req, res, next) => {
    try {
        const { cruiseId } = req?.params

        if (!cruiseId) {
            return res.status(400).send({
                message: errorMessages.idIsMissing
            })
        }

        if (!isValidObjectId(cruiseId)) {
            return res.status(400).send({
                message: errorMessages.invalidId
            })
        }

        const cruise = await cruiseModel.findById(cruiseId).exec()

        if (!cruise) {
            return res.status(400).send({
                message: "cruise not found"
            })
        }

        var cruise_details = null

        if (cruise?.link) {
            switch (cruise?.provider) {
                case "SILVERSEA":
                    cruise_details = await getSingleCruiseDataSilverSea(cruise?.link)
                    break;
                case "AZAMARA":
                    cruise_details = await getSingleCruiseDataAzamara(cruise?.objectId)
                    break;
                case "NCL":
                    cruise_details = await getSingleCruiseDataNCL(cruise?.link)
                    break;
                case "REGENT_SEVEN_SEAS":
                    cruise_details = await getSingleCruiseDataRegent(cruise?.link)
                    break;
                case "OCEANIA_CRUISES":
                    cruise_details = await getSingleCruiseDataOceania(cruise?.link)
                    break;
                case "RITZ_CARLTON_CRUISES":
                    cruise_details = await getSingleCruiseDataRitzCarlton(cruise?.link)
                    break;
                case "VIRGIN_CRUISES":
                    cruise_details = await getSingleCruiseDataVirgin(cruise?.link)
                    break;
                case "VIKING_CRUISES":
                    cruise_details = await getSingleCruiseDataViking(cruise?.link)
                    break;
                case "ROYAL_CARIBBEAN":
                    cruise_details = await scrapeRoyalCaribbean(cruise?.link)
                    break;
                case "CELEBRITY_CRUISES":
                    cruise_details = await scrapeCelebrity(cruise?.link)
                    break;
                case "CARNIVAL":
                    cruise_details = await scrapeCarnival(cruise?.link)
                    break;
                case "CUNARD":
                    cruise_details = await scrapeCunard(cruise?.link)
                    break;
                case "PRINCESS_CRUISES":
                    // pupeteer used
                    cruise_details = await scrapePrincess(cruise?.link)
                    break;
                case "SEABOURN":
                    cruise_details = {}
                    break;
                case "HOLLAND_AMERICA":
                    cruise_details = {}
                    break;

                default:
                    break;
            }
        }

        let data = { ...cruise_details, ...cruise?.toObject() }

        return res.send({
            message: "single cruise data fetched",
            data: data
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}
