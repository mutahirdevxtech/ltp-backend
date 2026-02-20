// CORS
export const allowedOrigins = [
    "https://www.luxetravelplans.com",
    "https://luxes-travel.vercel.app",
    "https://luxetravelplans.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:3001",
]

// REGULAR EXPRESSIONS
export const firstNamePattern = /^[a-zA-Z0-9 !@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{2,15}$/;
export const lastNamePattern = /^[a-zA-Z0-9 !@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{2,15}$/;
export const emailPattern = /^[a-zA-Z0-9!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
export const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?!.*\s{2})[a-zA-Z\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{8,24}$/;
export const otpPattern = /^[a-zA-Z0-9]{6}$/
export const phoneNumberPattern = /^\+(?:[0-9]?){6,14}[0-9]$/ // any international phone number
export const cardNumberRegex = /^\d{13,19}$/;
export const cardCvvRegex = /^\d{3,4}$/;
export const cardExpirationRegex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;

// JWT EXPIRY
export const initialSessionInDays = 15;
export const extendedSessionInDays = 30;

// SCHEMA STATUS
export const userStatusOptions = ["Active", "Disabled", "Suspended"]
export const userStatusArray = userStatusOptions.map((option) => option?.toUpperCase())

export const bookingStatuses = ["COMPLETED", "PENDING", "REJECTED"]

// ENUMS
export const rolesEnum = ["ADMIN", "CUSTOMER"]
export const loginStatuses = ["INVALID_PASSWORD", "INVALID_OTP", "SUCCESSFULL"]
export const loginSources = ["GOOGLE", "FACEBOOK", "EMAIL", "TWO FACTOR"]

// FILE SIZE LIMITS
export const $1mb = 10000000 // 1_mb
export const profilePictureSizeLimit = $1mb * 2 // 2_mb

// THIRD PARTY APIS
export const googleUserApi = "https://www.googleapis.com/oauth2/v3/userinfo"
export const facebookUserApi = "https://graph.facebook.com/v14.0/me?fields=id,first_name,last_name,email,picture&access_token="

// DEFAULT URLS FOR IMAGES IN DIRFFERENT SCHEMAS
export const profilePicture = "https://res.cloudinary.com/do6sd9nyx/image/upload/v1706343891/we-app-nextjs/Assets/profile-picture_ufgahm.png"

// EMAIL SUBJECTS
export const welcomeEmailSubject = "Welcome to Luxe Travel Plans"
export const emailVerificationSubject = "Email verification OTP"
export const resetPasswordSubject = "Password Reset OTP"
export const companyEmail = "bryan@luxetravelplans.com"

// POSTMARK EMAIL TEMPLATES
export const postmarkEmailTmeplates = {
    emailVerificationTemplate: "43589459",
    forgotPasswordTemplate: "43589568",
    welcomeTemplate: "43345890",
    secureLoginOtpTemplate: "43589614",
    accountActivationTemplate: "",
}

// CLOUDINARY STORAGE BUCKET FOLDERS
export const cloudinaryProfilePicturesFolder = "luxe-travel-plans/profile-pictures"

export const cruise_providers = [
    "CRUISINGPOWER",
    "GOCCL",
    "MSCBOOK",

    "SILVERSEA",
    "AZAMARA",
    "NCL",
    "OCEANIA_CRUISES",
    "REGENT_SEVEN_SEAS",
    "RITZ_CARLTON_CRUISES",
    "VIKING_CRUISES",
    "VIRGIN_CRUISES",
]