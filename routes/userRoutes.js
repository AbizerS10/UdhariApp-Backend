const router = require("express").Router();
const userCtrl = require("../controllers/userController");
const auth = require("../Middleware/auth");
const authAdmin = require("../Middleware/authAdmin");

router.post("/register", userCtrl.register);
router.post("/activation", userCtrl.activateEmail);
router.post("/login", userCtrl.login);
router.post("/refresh_token", userCtrl.getAccessToken);
router.post("/forgot", userCtrl.forgotPassword);
router.post("/udhari", auth, userCtrl.addUdhari);
router.get("/udhari", auth, userCtrl.showUdhari);
router.get("/logout", userCtrl.logout);
router.post("/reset", auth, userCtrl.resetPassword);
router.post("/send_alert", auth, userCtrl.sendUdhari);
router.patch("/send_paid_alert", auth, userCtrl.paidUdhari);
router.get("/infor", auth, userCtrl.getUserInfor);
router.get("/all_infor", auth, authAdmin, userCtrl.getUsersAllInfor);
router.patch("/update", auth, userCtrl.updateUser);
router.patch("/update_udhari", auth, userCtrl.updateUdhari);
router.patch("/update_role/:id", auth, authAdmin, userCtrl.updateUsersRole);
router.delete("/delete/:id", userCtrl.deleteUser);
router.delete("/deleteudhari/:id", userCtrl.deleteUdhari);

module.exports = router;
