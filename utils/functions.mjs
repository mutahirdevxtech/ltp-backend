export const escapeRegExp = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export const checkUserStatusUnAuth = (status) => {
    switch (status) {
        case "ACTIVE":
            return { isValid: true }
        case "REJECTED":
            return { isValid: false, message: "account is not active" }
        case "PENDING":
            return { isValid: false, message: "account is not active" }
        case "SUSPENDED":
            return { isValid: false, message: "account is suspended" }
        default:
            return { isValid: true }
            break;
    }
};
