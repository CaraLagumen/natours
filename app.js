//CORE MODULES
const path = require(`path`);
// const fs = require(`fs`);
const express = require(`express`);
const morgan = require(`morgan`); //LOGGER MIDDLEWARE
const rateLimit = require(`express-rate-limit`); //BLOCK DDOS, ETC. ATTEMPTS MIDDLEWARE
const helmet = require(`helmet`); //HTTP SECURITY HEADERS MIDDLEWARE
const mongoSanitize = require(`express-mongo-sanitize`);
const xss = require(`xss-clean`);
const hpp = require(`hpp`);
const cookieParser = require(`cookie-parser`);
const compression = require(`compression`);

const AppError = require(`./utils/appError`);
const globalErrorHandler = require(`./controllers/errorController`);
const tourRouter = require(`./routes/tourRoutes`);
const userRouter = require(`./routes/userRoutes`);
const reviewRouter = require(`./routes/reviewRoutes`);
const viewRouter = require(`./routes/viewRoutes`);
const bookingRouter = require(`./routes/bookingRoutes`);

const app = express();

//TRUST HEROKU
app.enable(`trust proxy`);

//USE PUG FOR TEMPLATE ENGINE
app.set(`view engine`, `pug`);
app.set(`views`, path.join(__dirname, `views`)); //path.join PREVENTS ANY ERRORS WITH /

//1. GLOBAL MIDDLEWARES
//USE MIDDLEWARE (.USE) MUST BE USED BEFORE ANY ROUTE HANDLER (THAT HAS RES.STATUS)

//SERVING STATIC FILES
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, `public`)));

//SET HTTP SECURITY HEADERS
app.use(helmet());

//DEVELOPMENT LOGGING
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === `development`) {
  //SET MORGAN ONLY FOR DEVELOPMENT
  app.use(morgan(`dev`));
}

//LIMIT REQUEUSTS FROM SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: `Too many requests from this IP, try again in an hour.`
});
app.use(`/api`, limiter);

//BODY PARSER, READ DATA FROM BODY INTO REQ.BODY & LIMIT DATA THAT'S IN BODY
app.use(express.json({ limit: `10kb` }));
//PARSE DATA FROM URL ENCODED FORM
app.use(express.urlencoded({ extended: true, limit: `10kb` }));
//COOKIE PARSER
app.use(cookieParser());

//DATA SANITIZATION AGAINST NOSQL QUERY INJECTION, EX:{ "email": { "$gt": "" } }
app.use(mongoSanitize());

//DATA SANITIZATION AGAINST XSS, EX: <div>blah</div>
app.use(xss());

//DEFEND PARAMETER POLLUTION, EX: ?sort=x&sort=y
app.use(
  hpp({
    whitelist: [
      //ENABLE DUPLICATES FOR WHITELISTED
      `duration`,
      `ratingsQuantity`,
      `ratingsAverage`,
      `maxGroupSize`,
      `difficulty`,
      `price`
    ]
  })
);

// app.use((req, res, next) => {
//   console.log(`Hello from the middleware.`);
//   next(); //MUST BE USED IN ALL MIDDLEWARE TO END MIDDLEWARE
// });

app.use(compression());

//TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

// app.get(`/`, (req, res) => {
//     res
//     .status(200)
//     .json({ message: `Hello from the server side.`, app: `Natours` });
// });

// app.post(`/`, (req, res) => {
//     res.send(`You can post to this endpoint.`);
// })

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

// //2.ROUTE HANDLERS
// const getAllTours = (req, res) => {
//   console.log(req.requestTime);
//   //SPECIFY VERSION
//   res.status(200).json({
//     status: `success`,
//     requestedAt: req.requestTime,
//     results: tours.length, //SHOW NUMBER OF RESULTS
//     data: {
//       tours
//     }
//   });
// };

// const getTour = (req, res) => {
//   //:id:users? MAKES IT OPTIONAL
//   console.log(req.params);

//   const id = req.params.id * 1; //MULTIPLY STRING TO CONVERT IT TO A NUMBER AUTOMATICALLY
//   const tour = tours.find(elem => elem.id === id);

//   if (!tour) {
//     //OR id > tours.length
//     return res.status(404).json({
//       status: `fail`,
//       message: `invalid id`
//     });
//   }

//   res.status(200).json({
//     status: `success`,
//     data: {
//       tour
//     }
//   });
// };

// const createTour = (req, res) => {
//   // console.log(req.body);

//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body); //CREATE NEW OBJECT

//   tours.push(newTour);
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     err => {
//       res.status(201).json({
//         status: `success`,
//         data: {
//           tour: newTour
//         }
//       });
//     }
//   );

//   // res.send(`Done`);
// };

// const updateTour = (req, res) => {
//   if (req.params.id > tours.length) {
//     return res.status(404).json({
//       status: `fail`,
//       message: `invalid id`
//     });
//   }

//   res.status(200).json({
//     status: `success`,
//     data: {
//       tour: `Updated tour here.`
//     }
//   });
// };

// const deleteTour = (req, res) => {
//   if (req.params.id > tours.length) {
//     return res.status(404).json({
//       status: `fail`,
//       message: `invalid id`
//     });
//   }

//   res.status(204).json({
//     //STATUS 204 NO CONTENT
//     status: `success`,
//     data: null
//   });
// };

// const getAllUsers = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   })
// }

// const createUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   })
// }

// const getUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   })
// }

// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   })
// }

// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   })
// }

// // //GET ALL TOURS
// // app.get(`/api/v1/tours`, getAllTours);
// // //GET TOUR
// // app.get(`/api/v1/tours/:id`, getTour);
// // //CREATE NEW TOUR
// // app.post(`/api/v1/tours`, createTour);
// // //UPDATE TOUR
// // app.patch(`/api/v1/tours/:id`, updateTour);
// // //DELETE TOUR
// // app.delete(`/api/v1/tours/:id`, deleteTour);

// //3. ROUTES
// //EASIER TO CHANGE VERSIONS
// const tourRouter = express.Router();
// const userRouter = express.Router();

// /*app*/tourRouter
//   .route(`/`) //.route(`/api/v1/tours`)
//   .get(getAllTours)
//   .post(createTour);

// /*app*/tourRouter
//   .route(`/:id`) //.route(`/api/v1/tours/:id`)
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

// /*app*/userRouter
//   .route(`/`) //.route(`/api/v1/users`)
//   .get(getAllUsers)
//   .post(createUser);

// /*app*/userRouter
//   .route(`/:id`) //.route(`/api/v1/users/:id`)
//   .get(getUser)
//   .patch(updateUser)
//   .delete(deleteUser);

//MOUNT OUR ROUTER
app.use(`/`, viewRouter);
app.use(`/api/v1/tours`, tourRouter); //ROUTERS USED AS MIDDLEWARE
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/reviews`, reviewRouter);
app.use(`/api/v1/bookings`, bookingRouter);

//ERROR HANDLING FOR WRONG ADDRESS
app.all(`*`, (req, res, next) => {
  // res.status(404).json({
  //   status: `fail`,
  //   message: `Can't find ${req.originalUrl} on this server!`
  // })

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = `fail`;
  // err.statusCode = 404;

  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//GLOBAL ERROR HANDLING MIDDLEWARE
app.use(
  globalErrorHandler
  // (err, req, res, next) => {
  // console.log(err.stack);
  // err.statusCode = err.statusCode || 500;
  // err.status = err.status || `error`;

  // res.status(err.statusCode).json({
  //   status: err.status,
  //   message: err.message
  // })
  // }
);

//4. START SERVER
// const port = 3000;
// app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });

module.exports = app;
