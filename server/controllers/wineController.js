const mongoose = require("mongoose");
const Wine = require("../models/Wine");
const Tasting = require("../models/Tasting");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function validateWinePayload(body) {
  const errors = [];

  if (typeof body.name !== "string" || !body.name.trim()) {
    errors.push("name is required");
  }
  if (typeof body.producer !== "string" || !body.producer.trim()) {
    errors.push("producer is required");
  }
  if (typeof body.country !== "string" || !body.country.trim()) {
    errors.push("country is required");
  }
  if (body.region !== undefined && typeof body.region !== "string") {
    errors.push("region must be a string");
  }
  if (typeof body.grape !== "string" || !body.grape.trim()) {
    errors.push("grape is required");
  }

  const vintage = Number(body.vintage);
  if (!Number.isInteger(vintage) || vintage < 1900 || vintage > new Date().getFullYear() + 1) {
    errors.push("vintage must be a realistic year");
  }

  return {
    errors,
    payload: {
      name: body.name?.trim(),
      producer: body.producer?.trim(),
      country: body.country?.trim(),
      region: typeof body.region === "string" ? body.region.trim() : "",
      grape: body.grape?.trim(),
      vintage,
    },
  };
}

exports.getAllWines = async (req, res) => {
  try {
    const wines = await Wine.find().sort({ name: 1, vintage: -1 });
    res.json(wines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWineById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid wine id" });
    }

    const wine = await Wine.findById(req.params.id);

    if (!wine) {
      return res.status(404).json({ message: "Wine not found" });
    }

    res.json(wine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTastingsForWine = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid wine id" });
    }

    const wine = await Wine.findById(req.params.id);
    if (!wine) {
      return res.status(404).json({ message: "Wine not found" });
    }

    const tastings = await Tasting.find({ wineId: req.params.id })
      .sort({ tastedAt: -1, createdAt: -1 })
      .populate("userId")
      .populate("wineId");

    res.json(tastings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWine = async (req, res) => {
  try {
    const { errors, payload } = validateWinePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    const wine = new Wine(payload);
    const savedWine = await wine.save();
    res.status(201).json(savedWine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateWine = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid wine id" });
    }

    const { errors, payload } = validateWinePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    const updatedWine = await Wine.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updatedWine) {
      return res.status(404).json({ message: "Wine not found" });
    }

    res.json(updatedWine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWine = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid wine id" });
    }

    const tastingExists = await Tasting.exists({ wineId: req.params.id });
    if (tastingExists) {
      return res.status(409).json({
        message: "Cannot delete a wine that is still referenced by tastings",
      });
    }

    const deletedWine = await Wine.findByIdAndDelete(req.params.id);
    if (!deletedWine) {
      return res.status(404).json({ message: "Wine not found" });
    }

    res.json({ message: "Wine deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
