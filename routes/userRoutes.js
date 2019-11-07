const express = require(`express`);
const userController = require(`./../controllers/userController`);
const authController = require(`./../controllers/authController`);

// const getAllUsers = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };

// const createUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };

// const getUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };

// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };

// const delceteUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };

const router = express.Router();

router.post(`/signup`, authController.signup);
router.post(`/login`, authController.login);
router.get(`/logout`, authController.logout); //GET COOKIE AND CHANGE IT

router.post(`/forgotPassword`, authController.forgotPassword);
router.patch(`/resetPassword/:token`, authController.resetPassword);

//INJECT MIDDLEWARE BEFORE ALL ROUTE USE AFTER CALL
router.use(authController.protect);

router.patch(`/updateMyPassword`, authController.updatePassword);
router.get(`/me`, userController.getMe, userController.getUser);
router.patch(
  `/updateMe`,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete(`/deleteMe`, userController.deleteMe);

//ONLY ADMINS CAN USE ALL ROUTES BELOW
router.use(authController.restrictTo(`admin`));

/*app*/ router
  .route(`/`) //.route(`/api/v1/users`)
  .get(userController.getAllUsers)
  .post(userController.createUser);

/*app*/ router
  .route(`/:id`) //.route(`/api/v1/users/:id`)
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
