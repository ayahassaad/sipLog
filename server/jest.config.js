// mongodb-memory-server downloads a MongoDB binary the first time it runs
// (cached after that), so give the first run plenty of headroom.
module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
};
