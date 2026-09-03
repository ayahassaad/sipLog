import axios from "axios";
import api from "./api";

// Uploads directly to Cloudinary from the browser using a short-lived signature
// from our backend, so image bytes never have to pass through (and be paid for
// by) our own server.
export async function uploadImage(file) {
  const { data: signatureData } = await api.get("/uploads/signature");

  if (!signatureData.cloudName) {
    throw new Error("Image uploads are not configured yet");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.timestamp);
  formData.append("signature", signatureData.signature);
  formData.append("folder", signatureData.folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
  const res = await axios.post(uploadUrl, formData);

  return res.data.secure_url;
}
