const express = require(`express`);
const reviewController = require(`./../controllers/reviewController`);
const authController = require(`./../controllers/authController`);

const router = express.Router({ mergeParams: true }); //GAIN ACCESS TO UPPER PARAMS (TOURS)

//SAME AS POST /tour/tourId/reviews & POST /reviews
router
  .route(`/`)
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo(`user`),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route(`/:id`)
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(authController.protect, reviewController.deleteReview);

module.exports = router;
