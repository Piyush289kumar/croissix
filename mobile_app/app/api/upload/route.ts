// mobile_app\app\api\upload\route.ts

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "gmb-posts" }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      })
      .end(buffer);
  });

  return Response.json(upload);
}
