const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    role: {
      type: Number,
    },
    shopname: {
      type: String,
    },
    shopaddress: {
      type: String,
      unique: true,
    },
    phonenumber: {
      type: Number,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Users = mongoose.model("user_details", registrationSchema);

const udhariSchema = new mongoose.Schema({
  shopid: {
    type: String,
  },
  customername: {
    type: String,
  },
  customeremail: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  udhari: {
    type: String,
  },
  created_at: {
    type: String,
  },
});

const Udhari = mongoose.model("udhari_details", udhariSchema);

module.exports = { Users, Udhari };
