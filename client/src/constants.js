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

// No userId here anymore - the backend always stamps tastings with the logged
// in user's id from their session, never from client input.
export const initialTastingForm = {
  wineId: "",
  appearance: "",
  noseNotes: "",
  palateNotes: "",
  sweetness: 1,
  acidity: 1,
  body: 1,
  tannin: 1,
  rating: 1,
  price: "",
  wouldBuyAgain: false,
  moodTags: [],
  personalThoughts: "",
  imageUrl: "",
};
