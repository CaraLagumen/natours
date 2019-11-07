// const fs = require(`fs`); //TESTING
const multer = require(`multer`); //IMG UPLOAD
const sharp = require(`sharp`); //RESIZING IMG
const User = require(`./../models/userModel`);
const catchAsync = require(`./../utils/catchAsync`);
const AppError = require(`./../utils/appError`);
const factory = require(`./handlerFactory`);

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, `public/img/users`);
//   },
//   filename: (req, file, cb) => {
//     //user-insertID-timestamp.fileExt
//     const ext = file.mimetype.split(`/`)[1]; //MIMETYPE = image/jpeg
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage(); //STORE IN MEMORY

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith(`image`)) {
    cb(null, true);
  } else {
    cb(new AppError(`Not an image.`, 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter }); //UPLOAD FILE TO DEST

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //IMAGE PROCESSING
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat(`jpeg`)
    .jpeg({ quality: 90 }) //SET QUALITY
    .toFile(`public/img/users/${req.file.filename}`); //WRITE THE FILE INTO FILE SYSTEM
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    //LOOP THROUGH FIELDS IN OBJ, IF ITS IN ALLOWED FIELD, ADD TO NEW OBJ
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: `success`,
//     results: users.length,
//     data: {
//       users
//     }
//   });
// });

//GET ONE MIDDLEWARE TO GET ME
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file, req.body);
  //1. CREATE ERROR IF USER POSTS PASSWORD DATA
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        `This route is not for password updates. Use /updateMyPassword.`,
        400
      )
    );
  }
  //2. FILTER OUT UNWANTED FIELD NAMES THAT ARE NOT ALLOWED TO BE UPDATED
  const filteredBody = filterObj(req.body, `name`, `email`); //PREVENTS USERS ACCESS FROM ADMIN FUNCTIONS
  if (req.file) filteredBody.photo = req.file.filename; //ADD PHOTO PROPERTY TO UPDATED OBJECT AND SET IT EQUAL TO THE FILE'S FILENAME
  //3. UPDATE USER DOCUMENT
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: `success`,
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: `success`,
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: `This route is not defined. Use /signup instead.`
  });
};

exports.getUser = factory.getOne(User);

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };

exports.updateUser = factory.updateOne(User); //DO NOT UPDATE PASSWORDS WITH THIS

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };

exports.deleteUser = factory.deleteOne(User);

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: `error`,
//     message: `This route is not yet defined!`
//   });
// };
