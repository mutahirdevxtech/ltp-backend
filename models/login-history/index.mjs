import mongoose from "mongoose";
import { loginSources, loginStatuses } from "../../utils/core.mjs";

let loginHistorySchema = new mongoose.Schema({
    loginStatus: {
        type: String,
        enum: loginStatuses,
        required: true
    },
    sessionDurationInMs: {
        type: Number,
        default: 0,
    },
    // ipAddress: {
    //     type: String,
    //     trim: true,
    //     required: true,
    // },
    // device: {
    //     type: String,
    //     trim: true,
    //     required: true,
    // },
    // browser: {
    //     type: String,
    //     trim: true,
    //     required: true,
    // },
    // operating_system: {
    //     type: String,
    //     trim: true,
    //     required: true,
    // },
    session: {
        type: String,
        trim: true,
        default: null,
    },
    isExpired: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "users"
    },
    source: {
        type: String,
        trim: true,
        enum: loginSources,
        default: "EMAIL"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

let loginHistoryModel;

try {
    loginHistoryModel = mongoose.model('login-histories');
} catch (error) {
    loginHistoryModel = mongoose.model('login-histories', loginHistorySchema);
}

export { loginHistoryModel };
