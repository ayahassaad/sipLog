const mongoose = require("mongoose");
const Tasting = require("../models/Tasting");
const User = require("../models/User");
const Wine = require("../models/Wine");

const scoreFields = ["sweetness", "acidity", "body", "tannin", "rating"];

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function parseScore(value, fieldName, errors) {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 5) {
    errors.push(`${fieldName} must be an integer between 1 and 5`);
    return null;
  }

  return numericValue;
}

function normalizeNotes(value, fieldName, errors) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${fieldName} must be an array of strings`);
    return [];
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function buildValidatedPayload(body, { partial = false } = {}) {
  const errors = [];
  const payload = {};

  if (!partial || body.userId !== undefined) {
    if (!isValidObjectId(body.userId)) {
      errors.push("userId must be a valid MongoDB ObjectId");
    } else {
      payload.userId = body.userId;
    }
  }

  if (!partial || body.wineId !== undefined) {
    if (!isValidObjectId(body.wineId)) {
      errors.push("wineId must be a valid MongoDB ObjectId");
    } else {
      payload.wineId = body.wineId;
    }
  }

  if (!partial || body.appearance !== undefined) {
    if (typeof body.appearance !== "string" || !body.appearance.trim()) {
      errors.push("appearance is required");
    } else {
      payload.appearance = body.appearance.trim();
    }
  }

  if (!partial || body.noseNotes !== undefined) {
    payload.noseNotes = normalizeNotes(body.noseNotes, "noseNotes", errors);
  }

  if (!partial || body.palateNotes !== undefined) {
    payload.palateNotes = normalizeNotes(body.palateNotes, "palateNotes", errors);
  }

  scoreFields.forEach((field) => {
    if (!partial || body[field] !== undefined) {
      payload[field] = parseScore(body[field], field, errors);
    }
  });

  if (!partial || body.price !== undefined) {
    const numericPrice = Number(body.price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      errors.push("price must be a non-negative number");
    } else {
      payload.price = numericPrice;
    }
  }

  if (!partial || body.wouldBuyAgain !== undefined) {
    if (typeof body.wouldBuyAgain !== "boolean") {
      errors.push("wouldBuyAgain must be a boolean");
    } else {
      payload.wouldBuyAgain = body.wouldBuyAgain;
    }
  }

  if (!partial || body.moodTags !== undefined) {
    if (!Array.isArray(body.moodTags) || body.moodTags.some((tag) => typeof tag !== "string")) {
      errors.push("moodTags must be an array of strings");
    } else {
      payload.moodTags = body.moodTags.map((tag) => tag.trim()).filter(Boolean);
    }
  }

  if (!partial || body.personalThoughts !== undefined) {
    if (
      typeof body.personalThoughts !== "string" ||
      body.personalThoughts.trim().length > 500
    ) {
      errors.push("personalThoughts must be a string with a maximum of 500 characters");
    } else {
      payload.personalThoughts = body.personalThoughts.trim();
    }
  }

  if (!partial || body.imageUrl !== undefined) {
    if (typeof body.imageUrl !== "string") {
      errors.push("imageUrl must be a string");
    } else {
      payload.imageUrl = body.imageUrl;
    }
  }

  if (!partial || body.tastedAt !== undefined) {
    const parsedDate = new Date(body.tastedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push("tastedAt must be a valid date");
    } else {
      payload.tastedAt = parsedDate;
    }
  }

  return { errors, payload };
}

async function validateLinkedDocuments(payload) {
  const errors = [];

  if (payload.userId) {
    const userExists = await User.exists({ _id: payload.userId });
    if (!userExists) {
      errors.push("Referenced user was not found");
    }
  }

  if (payload.wineId) {
    const wineExists = await Wine.exists({ _id: payload.wineId });
    if (!wineExists) {
      errors.push("Referenced wine was not found");
    }
  }

  return errors;
}

exports.getAllTastings = async (req, res) => {
  try {
    const query = {};

    if (req.query.userId) {
      if (!isValidObjectId(req.query.userId)) {
        return res.status(400).json({ message: "userId query must be a valid MongoDB ObjectId" });
      }
      query.userId = req.query.userId;
    }

    if (req.query.wineId) {
      if (!isValidObjectId(req.query.wineId)) {
        return res.status(400).json({ message: "wineId query must be a valid MongoDB ObjectId" });
      }
      query.wineId = req.query.wineId;
    }

    if (req.query.favorite === "true") {
      query.wouldBuyAgain = true;
    }

    if (req.query.minRating) {
      const minRating = Number(req.query.minRating);
      if (!Number.isInteger(minRating) || minRating < 1 || minRating > 5) {
        return res.status(400).json({ message: "minRating must be an integer between 1 and 5" });
      }
      query.rating = { $gte: minRating };
    }

    const wineMatch = {};
    if (req.query.grape) {
      wineMatch.grape = req.query.grape;
    }
    if (req.query.country) {
      wineMatch.country = req.query.country;
    }

    const tastings = await Tasting.find(query)
      .sort({ tastedAt: -1, createdAt: -1 })
      .populate("userId")
      .populate({
        path: "wineId",
        match: Object.keys(wineMatch).length > 0 ? wineMatch : undefined,
      });

    const filteredTastings = tastings.filter((tasting) => tasting.wineId);
    res.json(filteredTastings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTastingStats = async (_req, res) => {
  try {
    const [summary] = await Tasting.aggregate([
      {
        $group: {
          _id: null,
          totalTastings: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          averagePrice: { $avg: "$price" },
          favoritesCount: {
            $sum: {
              $cond: [{ $eq: ["$wouldBuyAgain", true] }, 1, 0],
            },
          },
        },
      },
    ]);

    const topMoodTags = await Tasting.aggregate([
      { $unwind: "$moodTags" },
      {
        $group: {
          _id: "$moodTags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 5 },
    ]);

    const topGrapes = await Tasting.aggregate([
      {
        $lookup: {
          from: "wines",
          localField: "wineId",
          foreignField: "_id",
          as: "wine",
        },
      },
      { $unwind: "$wine" },
      {
        $group: {
          _id: "$wine.grape",
          count: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
      { $sort: { count: -1, averageRating: -1, _id: 1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalTastings: summary?.totalTastings ?? 0,
      averageRating: summary?.averageRating
        ? Number(summary.averageRating.toFixed(1))
        : 0,
      averagePrice: summary?.averagePrice
        ? Number(summary.averagePrice.toFixed(2))
        : 0,
      favoritesCount: summary?.favoritesCount ?? 0,
      topMoodTags: topMoodTags.map((item) => ({
        tag: item._id,
        count: item.count,
      })),
      topGrapes: topGrapes.map((item) => ({
        grape: item._id,
        count: item.count,
        averageRating: Number(item.averageRating.toFixed(1)),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTastingById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid tasting id" });
    }

    const tasting = await Tasting.findById(req.params.id)
      .populate("userId")
      .populate("wineId");

    if (!tasting) {
      return res.status(404).json({ message: "Tasting not found" });
    }

    res.json(tasting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTasting = async (req, res) => {
  try {
    const { errors, payload } = buildValidatedPayload(req.body);
    const relationErrors = await validateLinkedDocuments(payload);

    if (errors.length > 0 || relationErrors.length > 0) {
      return res.status(400).json({
        message: [...errors, ...relationErrors].join(". "),
      });
    }

    const tasting = new Tasting(payload);
    const savedTasting = await tasting.save();
    res.status(201).json(savedTasting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTasting = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid tasting id" });
    }

    const { errors, payload } = buildValidatedPayload(req.body, { partial: false });
    const relationErrors = await validateLinkedDocuments(payload);

    if (errors.length > 0 || relationErrors.length > 0) {
      return res.status(400).json({
        message: [...errors, ...relationErrors].join(". "),
      });
    }

    const updatedTasting = await Tasting.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!updatedTasting) {
      return res.status(404).json({ message: "Tasting not found" });
    }

    res.json(updatedTasting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTasting = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid tasting id" });
    }

    const deletedTasting = await Tasting.findByIdAndDelete(req.params.id);

    if (!deletedTasting) {
      return res.status(404).json({ message: "Tasting not found" });
    }

    res.json({ message: "Tasting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
