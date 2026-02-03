import "dotenv/config"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = (file, folder) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!file) reject(new Error("file not provided"));
            const response = await cloudinary.uploader.upload(file?.path, {
                resource_type: "auto",
                folder: folder
            })
            fs.unlink(file?.path, (unlinkError) => {
                if (unlinkError) console.error("error removing local file:", unlinkError);
            });
            resolve(response);
        } catch (error) {
            fs.unlinkSync(file?.path)
            reject(error)
        }

    })

}

export const deleteFromCloudinary = (fileUrl, folder) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (fileUrl) {
                const public_id = `${folder}/${fileUrl.split("/").pop().split(".")[0]}`
                const resp = await cloudinary.uploader.destroy(public_id)
                resolve(resp)
            }
            resolve()
        } catch (error) {
            reject(error)
        }
    });
}

export const deleteManyFromCloudinary = (fileUrls, folder) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
                reject(new Error("fileUrls must be a non-empty array"));
                return;
            }

            const results = [];
            for (const fileUrl of fileUrls) {
                try {
                    if (fileUrl) {
                        const public_id = `${folder}/${fileUrl.split("/").pop().split(".")[0]}`;
                        const resp = await cloudinary.uploader.destroy(public_id);
                        results.push({ fileUrl, status: "deleted", response: resp });
                    }
                } catch (error) {
                    results.push({ fileUrl, status: "error", error: error.message });
                }
            }

            resolve(results);
        } catch (error) {
            reject(error);
        }
    });
};
