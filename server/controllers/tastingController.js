const Tasting = require("../models/Tasting");
require("../models/User");
require("../models/Wine");

exports.getAllTastings = async (req, res) => {
  try {
    const tastings = await Tasting.find()
      .populate("userId")
      .populate("wineId");
    res.json(tastings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTastingById = async (req, res) => {
  try {
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
    const tasting = new Tasting(req.body);
    const savedTasting = await tasting.save();
    res.status(201).json(savedTasting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTasting = async (req, res) => {
  try {
    const updatedTasting = await Tasting.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    const deletedTasting = await Tasting.findByIdAndDelete(req.params.id);

    if (!deletedTasting) {
      return res.status(404).json({ message: "Tasting not found" });
    }

    res.json({ message: "Tasting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
