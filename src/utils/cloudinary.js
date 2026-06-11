import { v2 as cloudinary} from "cloudinary";
import fs from "fs";







 // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });


const uploadToCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath){return null}
    //upload the file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {resource_type:"auto"})
    //file has been uploaded to cloudinary so we can remove it from local uploads folder
    console.log("File uploaded to Cloudinary, now removing from local server",response.url);
    return response;



  }
  catch (error) {
   fs.unlinkSync(localFilePath) //remove the locally saved temporary file in case of any error
   return null;
  }
}

export {uploadToCloudinary}
