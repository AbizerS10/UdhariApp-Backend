require("./db/conn");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");

const port = process.env.PORT || 8000;
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Routes
app.use("/user", require("./routes/userRoutes"));

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => {
  console.log("app listening at " + port);
});
