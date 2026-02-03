import fs from "fs"

export const removeLocalFile = (file) => {
    try {
        if (!file) reject(new Error("file not provided"));
        fs.unlink(file?.path, (unlinkError) => {
            if (unlinkError) console.error("error removing local file:", unlinkError);
        });
        resolve(response);
    } catch (error) {
        fs.unlinkSync(file?.path)
        reject(error)
    }
}
