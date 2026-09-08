const cloudinary = require("../config/cloudinary");

const UPLOAD_FOLDERS = {
  tasting: "siplog/tastings",
  avatar: "siplog/avatars",
};

// The frontend uploads the image file directly to Cloudinary (never through our
// server, so we don't pay to proxy image bytes). To do that without exposing our
// API secret to the browser, we sign the upload parameters here and hand back
// just the signature. `type` picks which folder gets signed (tastings vs.
// profile avatars) -- limited to a fixed whitelist rather than trusting an
// arbitrary client-supplied folder string.
exports.getUploadSignature = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ message: "Image uploads are not configured yet" });
    }

    const folder = UPLOAD_FOLDERS[req.query.type] || UPLOAD_FOLDERS.tasting;

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
