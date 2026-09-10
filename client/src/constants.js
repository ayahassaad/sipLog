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

export const WINE_TYPES = ["red", "white", "rose", "sparkling", "sweet"];

// Who can see a tasting on the Community feed. Your own My Journal always
// shows all of your entries no matter which of these is chosen; this only
// controls what other people can see.
export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Community", hint: "Visible to everyone" },
  { value: "followers", label: "Followers", hint: "Visible to people who follow you" },
  { value: "private", label: "Private", hint: "Visible only to you" },
];

export const initialWineForm = {
  name: "",
  producer: "",
  country: "",
  region: "",
  grape: "",
  vintage: 2020,
  type: "red",
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
  visibility: "public",
};
