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
    if (!localFilePath) {
      console.log("No file path provided");
      return null;
    }

    const absolutePath = path.resolve(localFilePath);

    console.log("Uploading file from:", absolutePath);

    const response = await cloudinary.uploader.upload(absolutePath, {
      resource_type: "auto",   // auto-detect image/video
      chunk_size: 6000000      // helps large video upload
    });

    console.log("File uploaded successfully:", response.secure_url);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return response;

  } catch (error) {
    console.log("Cloudinary upload error:", error);

    const absolutePath = path.resolve(localFilePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return null;
  }
};

export { uploadToCloudinary };