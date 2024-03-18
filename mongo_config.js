const mongoose = require("mongoose");

mongoose.connect(`${process.env.MONGODB_URL}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const databases = mongoose.connection;

const Interviews_db = databases.useDb("Interviews");

Interviews_db.on("error", console.error.bind(console, "connection error:"));
Interviews_db.once("open", async function () {
  console.log("Connected to Users DB");
});

module.exports = {
  Interviews_db,
};
