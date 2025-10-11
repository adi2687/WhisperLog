import {v2 as cloudinary } from 'cloudinary'

const connectCloudinary = async () => {
  try {
    await cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME || "dcheezp2x",
      api_key: process.env.CLOUDINARY_API_KEY || "991655215547186",
      api_secret: process.env.CLOUDINARY_SECRET_KEY || "TZ2iFcFqSM3IiYs0-RNWje35YUQ",
    });
  } catch (error) {
    console.log(error);
  }
};

export default connectCloudinary;