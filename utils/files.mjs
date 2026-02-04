import fs from "fs"

export const removeLocalFile = (file) => {
    try {
        if (file?.path) {
            fs.unlink(file.path);
            return { success: true, message: "file removed successfully" };
        }else{
            return { success: true, message: "file removed successfully" };
        }
    } catch (error) {
        console.error("error removing local file:", error);
        throw error;
    }
};
