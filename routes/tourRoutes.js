const express = require(`express`);
const tourController = require(`./../controllers/tourController`);
const authController = require(`./../controllers/authController`);
const reviewRouter = require(`./reviewRoutes`);
// const reviewController = require(`./../controllers/reviewController`);
// const fs = require(`fs`);

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// const getAllTours = (req, res) => {
//     console.log(req.requestTime);
//     //SPECIFY VERSION
//     res.status(200).json({
//       status: `success`,
//       requestedAt: req.requestTime,
//       results: tours.length, //SHOW NUMBER OF RESULTS
//       data: {
//         tours
//       }
//     });
//   };

//   const getTour = (req, res) => {
//     //:id:users? MAKES IT OPTIONAL
//     console.log(req.params);

//     const id = req.params.id * 1; //MULTIPLY STRING TO CONVERT IT TO A NUMBER AUTOMATICALLY
//     const tour = tours.find(elem => elem.id === id);

//     if (!tour) {
//       //OR id > tours.length
//       return res.status(404).json({
//         status: `fail`,
//         message: `invalid id`
//       });
//     }

//     res.status(200).json({
//       status: `success`,
//       data: {
//         tour
//       }
//     });
//   };

//   const createTour = (req, res) => {
//     // console.log(req.body);

//     const newId = tours[tours.length - 1].id + 1;
//     const newTour = Object.assign({ id: newId }, req.body); //CREATE NEW OBJECT

//     tours.push(newTour);
//     fs.writeFile(
//       `${__dirname}/dev-data/data/tours-simple.json`,
//       JSON.stringify(tours),
//       err => {
//         res.status(201).json({
//           status: `success`,
//           data: {
//             tour: newTour
//           }
//         });
//       }
//     );

//     // res.send(`Done`);
//   };

//   const updateTour = (req, res) => {
//     if (req.params.id > tours.length) {
//       return res.status(404).json({
//         status: `fail`,
//         message: `invalid id`
//       });
//     }

//     res.status(200).json({
//       status: `success`,
//       data: {
//         tour: `Updated tour here.`
//       }
//     });
//   };

//   const deleteTour = (req, res) => {
//     if (req.params.id > tours.length) {
//       return res.status(404).json({
//         status: `fail`,
//         message: `invalid id`
//       });
//     }

//     res.status(204).json({
//       //STATUS 204 NO CONTENT
//       status: `success`,
//       data: null
//     });
//   };

const router = express.Router();

// router.param(`id`, (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   next();
// })

// router.param(`id`, tourController.checkID);

router
  .route(`/top-5-cheap`)
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route(`/tour-stats`).get(tourController.getTourStats);

router
  .route(`/monthly-plan/:year`)
  .get(
    authController.protect,
    authController.restrictTo(`admin`, `lead-guide`, `guide`),
    tourController.getMonthlyPlan
  );

router
  .route(`/tours-within/:distance/center/:latlng/unit/:unit`)
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/36.0083181,-115.1999481/unit/mi - PREFERRED

router.route(`/distances/:latlng/unit/:unit`).get(tourController.getDistances);

/*app*/ router
  .route(`/`) //.route(`/api/v1/tours`)
  .get(tourController.getAllTours) //USE MIDDLEWARE FOR USER PROTECTION
  .post(
    authController.protect,
    authController.restrictTo(`admin`, `lead-guide`),
    tourController.createTour
  );
// .post(tourController.checkBody, tourController.createTour);

/*app*/ router
  .route(`/:id`) //.route(`/api/v1/tours/:id`)
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo(`admin`, `lead-guide`),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo(`admin`, `lead-guide`),
    tourController.deleteTour
  );

//TOUR ROUTER SHOULD USE REVIEW ROUTER IN CASE OF THIS
router.use(`/:tourId/reviews`, reviewRouter); //MOUNT ROUTER

//NESTED ROUTES
//POST /tour/idOfTour/reviews
//GET /tour/idOfTour/reviews
//GET /tour/idOfTour/reviews/idOfReview

//DOESN'T BELONG TO TOUR ROUTE - IMPORT FROM REVIEW ROUTER INSTEAD
// router
//   .route(`/:tourId/reviews`)
//   .post(
//     authController.protect,
//     authController.restrictTo(`user`),
//     reviewController.createReview
//   );

module.exports = router;
