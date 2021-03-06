const Review = require(`./../models/reviewModel`);
// const APIFeatures = require(`./../utils/apiFeatures`);
// const catchAsync = require(`./../utils/catchAsync`);
// const AppError = require(`./../utils/appError`);
const factory = require(`./handlerFactory`);

exports.getAllReviews = factory.getAll(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const features = new APIFeatures(Review.find(filter), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const reviews = await features.query;

//   res.status(200).json({
//     status: `success`,
//     requestedAt: req.requestTime,
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

exports.getReview = factory.getOne(Review);

// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id);

//   if (!review) {
//     return new AppError(`No review found with that ID.`, 404);
//   }

//   res.status(200).json({
//     status: `success`,
//     data: {
//       review
//     }
//   });
// });

//MIDDLEWARE - ADD TO ROUTES
exports.setTourUserIds = (req, res, next) => {
  //ALLOW NESTED ROUTES
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
}

exports.createReview = factory.createOne(Review);

// exports.createReview = catchAsync(async (req, res, next) => {
//   //ALLOW NESTED ROUTES - MOVED TO MIDDLEWARE
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;

//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: `success`,
//     data: {
//       review: newReview
//     }
//   });
// });

exports.updateReview = factory.updateOne(Review);

// exports.updateReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!review) {
//     return next(new AppError(`No review found with that ID.`, 404));
//   }

//   res.status(200).json({
//     status: `success`,
//     data: {
//       review
//     }
//   });
// });

exports.deleteReview = factory.deleteOne(Review);

// exports.deleteReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findByIdAndDelete(req.params.id);

//   if (!review) {
//     return next(new AppError(`No review found with that ID.`, 404));
//   }

//   res.status(204).json({
//     status: `success`,
//     data: null
//   });
// });
