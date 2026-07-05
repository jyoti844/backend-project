import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadToCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    // Match object
    const match = {
        isPublished: true
    };

    // Search by title
    if (query) {
        match.title = {
            $regex: query,
            $options: "i"
        };
    }

    // Filter by owner
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        match.owner = new mongoose.Types.ObjectId(userId);
    }

    // Create aggregate pipeline
    const aggregate = Video.aggregate([
        {
            $match: match
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        }
    ]);

    // Pagination options
    const options = {
        page: Number(page),
        limit: Number(limit)
    };

    // Get paginated videos
    const videos = await Video.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    );
});
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
  
    if(!title || !description){
        throw new ApiError(400, "Title and description are required")
    }

       // get local file paths from multer
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

     if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

  // upload to cloudinary
    const videoUpload = await uploadToCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadToCloudinary(thumbnailLocalPath);

     if (!videoUpload) {
        throw new ApiError(500, "Failed to upload video");
    }

    if (!thumbnailUpload) {
        throw new ApiError(500, "Failed to upload thumbnail");
    }
    // create video document
    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoUpload.duration,
        owner: req.user?._id
    });

    // check created video
    const createdVideo = await Video.findById(video._id);
    if(!createdVideo){
          throw new ApiError(500, "Something went wrong while publishing video");
    }
     return res.status(201).json(
        new ApiResponse(
            201,
            createdVideo,
            "Video published successfully"
        )
     );

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    // 1. validate id
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    // 2. find video in DB
    const video = await Video.findById(videoId);

    // 3. if not found
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // 4. send response
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    
    //TODO: update video details like title, description, thumbnail
      const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // update text fields
    if (title) video.title = title;
    if (description) video.description = description;

    // single file (thumbnail)
    const thumbnailLocalPath = req.file?.path;

    if (thumbnailLocalPath) {

        // delete old thumbnail if exists
        if (video.thumbnailPublicId) {
            await cloudinary.uploader.destroy(video.thumbnailPublicId);
        }

        // upload new thumbnail
        const thumbnailUpload = await uploadToCloudinary(thumbnailLocalPath);

        if (!thumbnailUpload) {
            throw new ApiError(500, "Thumbnail upload failed");
        }

        video.thumbnail = thumbnailUpload.secure_url;
        video.thumbnailPublicId = thumbnailUpload.public_id;
    }

    const updatedVideo = await video.save();

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // 1. validate id
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    // 2. find video
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // 3. delete thumbnail from Cloudinary (if exists)
    if (video.thumbnailPublicId) {
        await cloudinary.uploader.destroy(video.thumbnailPublicId);
    }

    // 4. delete video file from Cloudinary (if exists)
    if (video.videoPublicId) {
        await cloudinary.uploader.destroy(video.videoPublicId, {
            resource_type: "video"
        });
    }

    // 5. delete from database
    await Video.findByIdAndDelete(videoId);

    // 6. response
    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // 1. validate videoId
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    // 2. find video
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // 3. toggle publish status
    video.isPublished = !video.isPublished;

    // 4. save updated video
    await video.save();

    // 5. response
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            `Video is now ${video.isPublished ? "published" : "unpublished"}`
        )
    );
});
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}