const mongoose = require("mongoose");
require("dotenv").config();
const URI = process.env.MONGODB_URL;

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    UseUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((e) => {
    console.log(e.message);
  });
