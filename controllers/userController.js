const { Users, Udhari } = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { CLIENT_URL } = process.env;
const sendMail = require("./sendMail");
const sendEmail = require("./sendMail");

const userCtrl = {
  register: async (req, res) => {
    try {
      const { shopname, shopaddress, phonenumber, email, password } = req.body;

      if (!validateEmail(email))
        return res.status(400).json({ msg: "Invalid emails." });
      const user = await Users.findOne({ email });

      if (user)
        return res.status(400).json({ msg: "This email already exists." });
      if (password.length < 6)
        return res
          .status(400)
          .json({ msg: "Password must be at least 6 chracters long." });

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = {
        shopname,
        shopaddress,
        phonenumber,
        email,
        password: passwordHash,
      };
      const activation_token = createActivationToken(newUser);

      const url = `${CLIENT_URL}/user/activate/${activation_token}`;
      sendMail(
        email,
        `
      <div style="max-width: 700px; margin: auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 1rem;">
      <h2 style="text-align: center; text-transform: uppercase; color: teal;">Welcome to the Udhaari Alert App</h2>
      <p>Congratulations! You're almost set to start using our Udhaari alert app.
          Just click the button below to validate your email address.
      </p>
      <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display:inline-block;">Verify your email address</a>
      <p>If the button doesn't work for any reason, you can also click on the link below:</p>
      <div>${url}</div>
  </div>
      `
      );

      res.json({
        msg: "Register Success! Please activate your email to start.",
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  activateEmail: async (req, res) => {
    try {
      const { activation_token } = req.body;
      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      );

      const { shopname, shopaddress, phonenumber, email, password } = user;
      const check = await Users.findOne({ email });
      if (check)
        return res.status(400).json({ msg: "This email already exists" });
      const newUser = new Users({
        shopname,
        shopaddress,
        phonenumber,
        email,
        password,
      });
      await newUser.save();
      res.json({ msg: "Account has been activated!" });
    } catch (err) {
      return res
        .status(500)
        .json({ msg: err.message + " Please signup again" });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await Users.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: "This email does not exist." });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ msg: "Email or Password is incorrect." });

      const refresh_token = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/user/refresh_token",
        maxAge: 1 * 60 * 60 * 1000,
      });

      res.json({ msg: "Login success" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getAccessToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token)
        return res.status(400).json({ msg: "Please login again!" });

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err)
          return res
            .status(400)
            .json({ msg: "Something went wrong, Please login again!" });

        const access_token = createAccessToken({ id: user.id });
        res.json({ access_token });
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await Users.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: "This email does not exist." });

      const access_token = createAccessToken({ id: user._id });
      const url = `${CLIENT_URL}/user/reset/${access_token}`;

      sendEmail(
        email,
        `
      <div style="max-width: 700px; margin: auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 1rem;">
      <h2 style="text-align: center; text-transform: uppercase; color: teal;">Welcome to the Udhaari Alert App</h2>
      <p>Congratulations! You're almost set to start using our Udhaari alert app.
          Just click the button below to validate your email address.
      </p>
      <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display:inline-block;">Reset your password</a>
      <p>If the button doesn't work for any reason, you can also click on the link below:</p>
      <div>${url}</div>
  </div>
      `
      );
      res.json({ msg: "Re-sent the password, please check your email." });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;
      const passwordhash = await bcrypt.hash(password, 12);
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          password: passwordhash,
        }
      );

      res.json({ msg: "Password changed successfully!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getUserInfor: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      res.json(user);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getUsersAllInfor: async (req, res) => {
    try {
      const users = await Users.find().select("-password");
      res.json(users);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/user/refresh_token" });
      return res.json({ msg: "Logged out Successfully!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  updateUser: async (req, res) => {
    try {
      const { phonenumber } = req.body;
      await Users.findOneAndUpdate({ _id: req.user.id }, { phonenumber });
      res.json({ msg: "Updated Phone Number Successfully!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  updateUsersRole: async (req, res) => {
    try {
      const { role } = req.body;
      await Users.findOneAndUpdate({ _id: req.params.id }, { role });
      res.json({ msg: "Update Success!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  deleteUser: async (req, res) => {
    try {
      await Users.findByIdAndDelete(req.params.id);
      res.json({ msg: "User deleted!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  deleteUdhari: async (req, res) => {
    try {
      await Udhari.findByIdAndDelete(req.params.id);
      res.json({ msg: "Udhari deleted!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  addUdhari: async (req, res) => {
    try {
      const { customername, customeremail, udhari, created_at } = req.body;
      const user = await Udhari.findOne({ customeremail, status: "pending" });
      if (user)
        return res.status(400).json({
          msg: "This customer already exists. Please update the existing one.",
        });
      const newUdhari = new Udhari({
        shopid: req.user.id,
        customername,
        customeremail,
        udhari,
        created_at,
      });
      await newUdhari.save();
      res.json({ msg: "Udhari saved successfully!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  showUdhari: async (req, res) => {
    try {
      const status = req.query.status;
      const user = await Udhari.find({
        shopid: req.user.id,
        status: status,
      }).sort({
        created_at: -1,
      });
      res.json(user);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  updateUdhari: async (req, res) => {
    try {
      const { udhari, customeremail } = req.body;
      await Udhari.findOneAndUpdate(
        { shopid: req.user.id, customeremail },
        { udhari }
      );
      res.json({ msg: "Udhari updated successfully!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  sendUdhari: async (req, res) => {
    try {
      const { customeremail, udhari } = req.body;
      const user = await Users.findOne({ _id: req.user.id });
      sendMail(
        customeremail,
        `
    <div style="max-width: 700px; margin: auto; border: 10px solid #ddd; padding: 30px 20px; font-size: 1rem;">
    <h3 style="text-align: center; text-transform: uppercase; color: teal;">This is a remainder for your udhari from Shop: ${user.shopname}</h3>
    <p>Below are the details of your udhari:</p>
    <p>${udhari}</p>
    </div>
    `
      );
      res.json({ msg: "Alert sent successfully!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  paidUdhari: async (req, res) => {
    try {
      const { customeremail, udhari } = req.body;
      await Udhari.findOneAndUpdate(
        { shopid: req.user.id, customeremail, status: "pending" },
        { status: "paid" }
      );
      const user = await Users.findOne({ _id: req.user.id });
      sendMail(
        customeremail,
        `
    <div style="max-width: 700px; margin: auto; border: 10px solid #ddd; padding: 30px 20px; font-size: 1rem;">
    <h3 style="text-align: center; text-transform: uppercase; color: teal;">The shopkeeper of ${user.shopname} has marked your udhari as Paid</h3>
    <p>Below are the details of your udhari:</p>
    <p>${udhari}</p>
    </div>
    `
      );
      res.json({ msg: "Udhari Marked as Paid!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: "5m",
  });
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = userCtrl;
