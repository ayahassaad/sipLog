require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Wine = require("../models/Wine");
const Tasting = require("../models/Tasting");

const userIds = {
  ayah: new mongoose.Types.ObjectId("69e681b2b977676391c086f2"),
  sara: new mongoose.Types.ObjectId("69e800000000000000000001"),
  leila: new mongoose.Types.ObjectId("69e800000000000000000002"),
  emma: new mongoose.Types.ObjectId("69e800000000000000000003"),
  nora: new mongoose.Types.ObjectId("69e800000000000000000004"),
};

const wineIds = {
  rioja: new mongoose.Types.ObjectId("69e6893fb977676391c086fc"),
  pinot: new mongoose.Types.ObjectId("69e800000000000000000011"),
  syrah: new mongoose.Types.ObjectId("69e800000000000000000012"),
  rose: new mongoose.Types.ObjectId("69e800000000000000000013"),
  chianti: new mongoose.Types.ObjectId("69e800000000000000000014"),
};

const users = [
  { _id: userIds.ayah, name: "Ayah Assaad", email: "ayah@siplog.app" },
  { _id: userIds.sara, name: "Sara Nilsson", email: "sara@siplog.app" },
  { _id: userIds.leila, name: "Leila Haddad", email: "leila@siplog.app" },
  { _id: userIds.emma, name: "Emma Berg", email: "emma@siplog.app" },
  { _id: userIds.nora, name: "Nora Lind", email: "nora@siplog.app" },
];

const wines = [
  {
    _id: wineIds.rioja,
    name: "Rioja Reserva",
    producer: "Marques de Riscal",
    country: "Spain",
    region: "Rioja",
    grape: "Tempranillo",
    vintage: 2020,
  },
  {
    _id: wineIds.pinot,
    name: "Cote d'Or Pinot Noir",
    producer: "Maison Louis Jadot",
    country: "France",
    region: "Burgundy",
    grape: "Pinot Noir",
    vintage: 2021,
  },
  {
    _id: wineIds.syrah,
    name: "Barossa Valley Shiraz",
    producer: "Penfolds",
    country: "Australia",
    region: "Barossa Valley",
    grape: "Syrah",
    vintage: 2019,
  },
  {
    _id: wineIds.rose,
    name: "Whispering Angel Rose",
    producer: "Chateau d'Esclans",
    country: "France",
    region: "Provence",
    grape: "Grenache Blend",
    vintage: 2023,
  },
  {
    _id: wineIds.chianti,
    name: "Chianti Classico",
    producer: "Ruffino",
    country: "Italy",
    region: "Tuscany",
    grape: "Sangiovese",
    vintage: 2021,
  },
];

const tastings = [
  {
    userId: userIds.ayah,
    wineId: wineIds.rioja,
    appearance: "Deep ruby with garnet rim",
    noseNotes: ["black cherry", "cedar", "vanilla"],
    palateNotes: ["plum", "spice", "oak"],
    sweetness: 1,
    acidity: 4,
    body: 4,
    tannin: 4,
    rating: 5,
    price: 229,
    wouldBuyAgain: true,
    moodTags: ["Date night", "Dinner party"],
    personalThoughts: "Silky and polished with enough structure to feel special.",
    tastedAt: new Date("2026-04-12T19:30:00.000Z"),
  },
  {
    userId: userIds.sara,
    wineId: wineIds.pinot,
    appearance: "Transparent ruby",
    noseNotes: ["raspberry", "rose petal", "forest floor"],
    palateNotes: ["red cherry", "tea", "mushroom"],
    sweetness: 1,
    acidity: 5,
    body: 2,
    tannin: 2,
    rating: 4,
    price: 265,
    wouldBuyAgain: true,
    moodTags: ["Girls night", "Gift-worthy"],
    personalThoughts: "Elegant and lifted, really pretty with food.",
    tastedAt: new Date("2026-04-14T17:45:00.000Z"),
  },
  {
    userId: userIds.leila,
    wineId: wineIds.syrah,
    appearance: "Opaque purple ruby",
    noseNotes: ["blackberry", "pepper", "smoke"],
    palateNotes: ["dark fruit", "olive", "cocoa"],
    sweetness: 1,
    acidity: 3,
    body: 5,
    tannin: 4,
    rating: 4,
    price: 310,
    wouldBuyAgain: false,
    moodTags: ["Celebration", "Dinner party"],
    personalThoughts: "Huge and powerful, best for a long meal rather than casual sipping.",
    tastedAt: new Date("2026-04-15T20:10:00.000Z"),
  },
  {
    userId: userIds.emma,
    wineId: wineIds.rose,
    appearance: "Pale salmon pink",
    noseNotes: ["strawberry", "citrus peel", "white flowers"],
    palateNotes: ["peach", "melon", "grapefruit"],
    sweetness: 2,
    acidity: 4,
    body: 2,
    tannin: 1,
    rating: 4,
    price: 189,
    wouldBuyAgain: true,
    moodTags: ["Summer patio", "Weeknight"],
    personalThoughts: "Fresh, bright, and easy to love on a warm evening.",
    tastedAt: new Date("2026-04-18T16:20:00.000Z"),
  },
  {
    userId: userIds.nora,
    wineId: wineIds.chianti,
    appearance: "Bright ruby red",
    noseNotes: ["sour cherry", "dried herbs", "violet"],
    palateNotes: ["cranberry", "earth", "tomato leaf"],
    sweetness: 1,
    acidity: 5,
    body: 3,
    tannin: 3,
    rating: 3,
    price: 175,
    wouldBuyAgain: false,
    moodTags: ["Weeknight", "Cozy night"],
    personalThoughts: "Very food-friendly and lively, though a little sharp on its own.",
    tastedAt: new Date("2026-04-19T18:00:00.000Z"),
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({});
  await Wine.deleteMany({});
  await Tasting.deleteMany({});

  await User.insertMany(users);
  await Wine.insertMany(wines);
  await Tasting.insertMany(tastings);

  console.log("Seed complete:");
  console.log(`- users: ${users.length}`);
  console.log(`- wines: ${wines.length}`);
  console.log(`- tastings: ${tastings.length}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
