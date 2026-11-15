import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { BlogService } from "./blog.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { IBlogFilters } from "./blog.interface";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { BlogValidation } from "./blog.validation";
import { uploadFile } from "../../../helpars/fileUploader";

// create blog
const createBlog = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const blogData = req.body;

  // handle image uploads
  let imageUrls: string[] = [];
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  // check if images are provided
  if (imageUrls.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Images are required",
      data: null,
    });
  }

  // combine blog data with image URLs
  const finalBlogData = {
    ...blogData,
    image: imageUrls,
  };

  const result = await BlogService.createBlog(finalBlogData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog created successfully",
    data: result,
  });
});

// get all blogs
const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["search", "category", "minDate", "maxDate"]);
  const options = pick(req.query, paginationFields);

  const result = await BlogService.getAllBlogs(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blogs retrieved successfully",
    data: result,
  });
});

// get single blog
const getSingleBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogService.getSingleBlog(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog retrieved successfully",
    data: result,
  });
});

// update blog
const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const blogData = req.body;

  // handle image uploads if new images are provided
  let imageUrls: string[] = [];
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  // combine blog data with image URLs if new images are uploaded
  const finalBlogData = {
    ...blogData,
    ...(imageUrls.length > 0 && { image: imageUrls }),
  };

  const result = await BlogService.updateBlog(id, finalBlogData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog updated successfully",
    data: result,
  });
});

// delete blog
const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogService.deleteBlog(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog deleted successfully",
    data: result,
  });
});

export const BlogController = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};
