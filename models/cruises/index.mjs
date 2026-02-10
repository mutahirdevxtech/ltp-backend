import { cruise_providers } from "../../utils/core.mjs"
import mongoose from "mongoose";

// cruise schema
let cruiseSchema = new mongoose.Schema({
    title: {
        type: String,
        default: null,
    },
    ship: {
        type: String,
        default: null,
    },
    startDate: {
        type: Date,
        default: null,
    },
    endDate: {
        type: Date,
        default: null,
    },
    duration: {
        type: String,
        default: null,
    },
    price: {
        type: String,
        default: null,
    },
    link: {
        type: String,
        default: null,
    },
    image: {
        type: String,
        default: null,
    },
    provider: {
        type: String,
        enum: cruise_providers,
        default: cruise_providers[0]
    },
    objectId: {
        type: String,
        default: null,
    }
}, { timestamps: true });

let cruiseModel;

try {
    cruiseModel = mongoose.model('cruises');
} catch (error) {
    cruiseModel = mongoose.model('cruises', cruiseSchema);
}

export { cruiseModel };
