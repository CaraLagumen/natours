// const fs = require(`fs`); //TESTING
const multer = require(`multer`); //IMG UPLOAD
const sharp = require(`sharp`); //RESIZING IMG
const Tour = require(`./../models/tourModel`);
// const APIFeatures = require(`./../utils/apiFeatures`);
const catchAsync = require(`./../utils/catchAsync`);
const AppError = require(`./../utils/appError`);
const factory = require(`./handlerFactory`);

const multerStorage = multer.memoryStorage(); //STORE IN MEMORY

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith(`image`)) {
    cb(null, true);
  } else {
    cb(new AppError(`Not an image.`, 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter }); //UPLOAD FILE TO DEST

//UPLOAD MULTIPLE IMAGES
exports.uploadTourImages = upload.fields([
  {
    name: `imageCover`,
    maxCount: 1
  },
  { name: `images`, maxCount: 3 }
]);
//upload.array(`images`, 5); req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  //1. COVER IMAGE
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat(`jpeg`)
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`); //SET TO REQ IMAGECOVER

  //2. IMAGES
  req.body.images = [];
  await Promise.all(
    //ARRAY PROMISE WORKAROUND
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat(`jpeg`)
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = `5`;
  req.query.sort = `-ratingsAverage,price`;
  req.query.fields = `name,price,ratingsAverage,summary,difficulty`;
  next();
};

//TESTING
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//TESTS FOR HOW MIDDLEWARE WORKS
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   if (req.params.id > tours.length) {
//     return res.status(404).json({
//       status: `fail`,
//       message: `invalid id`
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   console.log(req.body.name);
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: `fail`,
//       message: `name or price required`
//     });
//   }
//   next();
// };

exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //try {
//   //BUILD QUERY
//   // //1. FILTERING
//   // const queryObj = { ...req.query }; //SHALLOW COPY
//   // const excludedFields = [`page`, `sort`, `limit`, `fields`];
//   // excludedFields.forEach(el => delete queryObj[el]); //REMOVES SORTING FROM QUERY

//   // // console.log(req.query, queryObj);
//   // //2. ADVANCED FILTERING
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//   // // console.log(JSON.parse(queryStr));
//   // //{ difficulty: `easy`, duration: { $gte: 5 } }
//   // //{ difficulty: `easy`, duration: { gte: '5' } }
//   // let query = Tour.find(JSON.parse(queryStr));

//   // // 3. SORTING
//   // if (req.query.sort) {
//   //   //?sort=-price,ratingsAverage
//   //   const sortBy = req.query.sort.split(`,`).join(` `);
//   //   // console.log(sortBy);
//   //   query = query.sort(sortBy);
//   //   //sort(`price ratingsAverage)
//   // } else {
//   //   query = query.sort(`-createdAt`);
//   // }

//   // //4. FIELD LIMITING
//   // if (req.query.fields) {
//   //   //?fields=name,price
//   //   const fields = req.query.fields.split(`,`).join(` `);
//   //   query = query.select(fields); //(`name duration price`)
//   // } else {
//   //   query = query.select(`-__v`); //RETURNS ALL FIELDS AND EXCLUDES ONLY __v
//   // }

//   // //5. PAGINATION
//   // const page = req.query.page * 1 || 1; //CONVERT STRING TO NUMBER
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit; //NUMBER OF DOCUMENTS TO BE SKIPPED

//   // query = query.skip(skip).limit(limit);
//   // // query = query.skip(2).limit(10); //page=2&limit=10

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error(`This page does not exist.`);
//   // }

//   //6. EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   // query.sort().select().skip().limit()

//   //SEARCH FOR QUERIES
//   // const tours = await Tour.find({
//   //   duration: 5,
//   //   difficulty: `easy`
//   // });
//   //SIMILAR TO UPPER
//   // const tours = await Tour.find()
//   // .where(`duration`)
//   // .equals(5)
//   // .where(`difficulty`)
//   // .equals(`easy`);

//   // console.log(req.requestTime);
//   //SPECIFY VERSION/SEND RESPONSE
//   res.status(200).json({
//     status: `success`,
//     requestedAt: req.requestTime,
//     results: tours.length, //SHOW NUMBER OF RESULTS
//     data: {
//       tours
//     }
//   });
//   //}
// });

exports.getTour = factory.getOne(Tour, { path: `reviews` });
//SAME AS `const tour = await Tour.findById(req.params.id).populate(`reviews`);` BELOW

// exports.getTour = catchAsync(async (req, res, next) => {
//   //try {
//   const tour = await Tour.findById(req.params.id).populate(`reviews`);
//   //MOVED TO TOURMODEL
//   //   .populate({ //POPULATE FILLS UP GUIDES FIELD
//   //   path: `guides`,
//   //   select: `-__v -passwordChangedAt` //- REMOVES SELECTED VARIABLES
//   // });

//   if (!tour) {
//     return next(new AppError(`No tour found with that ID.`, 404));
//   }

//   res.status(200).json({
//     status: `success`,
//     data: {
//       tour
//     }
//   });

//   //:id:users? MAKES IT OPTIONAL
//   // console.log(req.params);

//   // const id = req.params.id * 1; //MULTIPLY STRING TO CONVERT IT TO A NUMBER AUTOMATICALLY
//   // const tour = tours.find(elem => elem.id === id);

//   // //   if (!tour) {
//   // //     //OR id > tours.length
//   // //     return res.status(404).json({
//   // //       status: `fail`,
//   // //       message: `invalid id`
//   // //     });
//   // //   }

//   // res.status(200).json({
//   //   status: `success`,
//   //   data: {
//   //     tour
//   //   }
//   // });
// });

//LIKE TEMPLATE FOR ERROR HANDLING - TO BE PLUGGED INTO AND ASSIGNED INTO AN ACTUAL FUNCTION
// const catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   }
// };

exports.createTour = factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   // const newTours = new Tour({});
//   // newTours.save();
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: `success`,
//     data: {
//       tour: newTour
//     }
//   });

//   // try {
//   //   const newTour = await Tour.create(req.body);

//   //   res.status(201).json({
//   //     status: `success`,
//   //     data: {
//   //       tour: newTour
//   //     }
//   //   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: `fail`,
//   //     message: err
//   //   });
//   // }
// });

// exports.createTour = async (req, res) => {
//   // const newTours = new Tour({});
//   // newTours.save();

//   try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: `success`,
//       data: {
//         tour: newTour
//       }
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: `fail`,
//       message: err
//     });
//   }
// };

// exports.createTour = (req, res) => {
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

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   //   if (req.params.id > tours.length) {
//   //     return res.status(404).json({
//   //       status: `fail`,
//   //       message: `invalid id`
//   //     });
//   //   }

//   //try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     //OLD, UPDATE, EXTRA ARG
//     new: true,
//     runValidators: true
//   });

//   if (!tour) {
//     return next(new AppError(`No tour found with that ID.`, 404));
//   }

//   res.status(200).json({
//     status: `success`,
//     data: {
//       tour
//     }
//   });
//   //}
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   //MOVED TO A PARAM MIDDLEWARE
//   //   if (req.params.id > tours.length) {
//   //     return res.status(404).json({
//   //       status: `fail`,
//   //       message: `invalid id`
//   //     });
//   //   }
//   // try {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError(`No tour found with that ID.`, 404));
//   }

//   res.status(204).json({
//     //STATUS 204 NO CONTENT
//     status: `success`,
//     data: null
//   });
//   // }
// });

//AGGREGATION PIPELINE (EX: TOUR STATS)
exports.getTourStats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: `$difficulty` },
        // _id: `$ratingsAverage`,
        numTours: { $sum: 1 },
        numRatings: { $sum: `$ratingsQuantity` },
        avgRating: { $avg: `$ratingsAverage` },
        avgPrice: { $avg: `$price` },
        minPrice: { $min: `$price` },
        maxPrice: { $max: `$price` }
      }
    },
    {
      $sort: { avgPrice: 1 }
    } /*,
      { //YOU CAN REPEAT STAGES
        $match: { _id: { $ne: `EASY` } } //REMOVES EASY
      }*/
  ]);

  res.status(200).json({
    status: `success`,
    data: {
      stats
    }
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: `fail`,
  //     message: `Invalid data sent.`
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // try {
  const year = req.params.year * 1; //2021
  const plan = await Tour.aggregate([
    {
      $unwind: `$startDates` //DECONSTRUCTS DOCUMENT
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: `$startDates` },
        numTourStarts: { $sum: 1 },
        tours: { $push: `$name` }
      }
    },
    {
      $addFields: { month: `$_id` }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 6
    }
  ]);

  res.status(200).json({
    status: `success`,
    data: {
      plan
    }
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: `fail`,
  //     message: `Invalid data sent.`
  //   });
  // }
});

// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/36.0083181,-115.1999481/unit/mi - PREFERRED
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(`,`); //SPLIT PARAM

  const radius = unit === `mi` ? distance / 3963.2 : distance / 6378.1; //CONVERT TO MI OR KM

  if (!lat || !lng) {
    next(
      new AppError(`Provide latitude and longitude in the format lat,lng.`, 400)
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: `success`,
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(`,`); //SPLIT PARAM

  const multiplier = unit === `mi` ? 0.000621371 : 0.001; // CONVERT TO MI OR KM

  if (!lat || !lng) {
    next(
      new AppError(`Provide latitude and longitude in the format lat,lng.`, 400)
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: `Point`,
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: `distance`,
        distanceMultiplier: multiplier
      } //ALWAYS NEEDS TO BE FIRST FOR GEOSPATIAL
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: `success`,
    results: distances.length,
    data: {
      data: distances
    }
  });
});
