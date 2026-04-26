export const TASTINGS_API_URL = "http://localhost:5001/api/tastings";
export const WINES_API_URL = "http://localhost:5001/api/wines";

export const MOOD_TAGS = [
  "Date night",
  "Cozy night",
  "Dinner party",
  "Girls night",
  "Celebration",
  "Gift-worthy",
  "Weeknight",
  "Summer patio",
];

export const initialWineForm = {
  name: "",
  producer: "",
  country: "",
  region: "",
  grape: "",
  vintage: 2020,
};

export const initialTastingForm = {
  userId: "69e681b2b977676391c086f2",
  wineId: "",
  appearance: "",
  noseNotes: "",
  palateNotes: "",
  sweetness: 1,
  acidity: 1,
  body: 1,
  tannin: 1,
  rating: 1,
  price: 0,
  wouldBuyAgain: false,
  moodTags: [],
  personalThoughts: "",
  imageUrl: "",
};
