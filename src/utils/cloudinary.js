import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    // file path check
    if (!localFilePath) {
      console.log("No file path provided");
      return null;
    }

    // convert to absolute path
    const absolutePath = path.resolve(localFilePath);

    console.log("Uploading file from:", absolutePath);

    // upload file
    const response = await cloudinary.uploader.upload(absolutePath);

    console.log("File uploaded successfully:", response.secure_url);

    // remove local file after successful upload
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return response;

  } catch (error) {
    console.log("Cloudinary upload error:", error);

    // remove local file if upload fails
    const absolutePath = path.resolve(localFilePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return null;
  }
};

export { uploadToCloudinary };