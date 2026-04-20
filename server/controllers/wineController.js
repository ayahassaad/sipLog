const Wine = require("../models/Wine");

exports.getAllWines = async (req, res) => {
  try {
    const wines = await Wine.find().sort({ name: 1, vintage: -1 });
    res.json(wines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWine = async (req, res) => {
  try {
    const wine = new Wine(req.body);
    const savedWine = await wine.save();
    res.status(201).json(savedWine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
