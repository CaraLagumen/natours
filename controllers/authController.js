const crypto = require(`crypto`);
const { promisify } = require(`util`); //BUILT IN PROMISIFY FUNCTION
const jwt = require(`jsonwebtoken`);
const User = require(`./../models/userModel`);
const catchAsync = require(`./../utils/catchAsync`);
const AppError = require(`./../utils/appError`);
const Email = require(`./../utils/email`);

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

//CREATE COOKIE AND ATTACH TOKEN
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, //ONLY SENDS IN ENCRYPTED CONNECTION
    httpOnly: true, //COOKIE CANNOT BE ACCESSED OR MODIFIED BY BROWSER
    secure: req.secure || req.headers(`x-forwarded-proto`) === `https`
  };

  //SEND ONLY IF IN PRODUCTION MODE
  //SEE SECURE ABOVE FOR HEROKU SPECIFIC SETTINGS
  // if (process.env.NODE_ENV === `production`) cookieOptions.secure = true;

  //SEND COOKIE
  res.cookie(`jwt`, token, cookieOptions);

  //REMOVE PASSWORD FROM OUTPUT
  user.password = undefined;

  res.status(statusCode).json({
    status: `success`,
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //!!INSUFFICIENT - CREATES NEW USERS WITH ADMIN ROLE!!
  // const newUser = await User.create(req.body); //CAN ALSO BE USER.SAVE

  //MORE SUFFICIENT CODE FOR PROTECTION
  //ALLOWS ONLY CERTAIN DATA TO BE REGISTERED
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);

  // const token = signToken(newUser._id); //jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  // //     expiresIn: process.env.JWT_EXPIRES_IN
  // // });

  // res.status(201).json({
  //   status: `success`,
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; //DESTRUCTURE email = req.body.email;

  //1. IF EMAIL & PASSWORD EXIST
  if (!email || !password) {
    return next(new AppError(`Please provide an email and password.`, 400));
  }
  //2. CHECK IF USER EXISTS & PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select(`+password`);
  // console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Incorrect email or password.`, 401));
  }

  //3. AFTER VERIFYING EVERYTHING, SEND TOKEN TO CLIENT
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: `success`,
  //   token
  // });
});

//OVERWRITE COOKIE TO LOG OUT
exports.logout = (req, res) => {
  res.cookie(`jwt`, `loggedout`, {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: `success` });
};

//MIDDLEWARE FOR PROTECTING ROUTES FOR LOGGED IN USERS
//BASICALLY USING HEADERS TO SAY YOU ARE LOGGED IN
exports.protect = catchAsync(async (req, res, next) => {
  //1. GET TOKEN AND CHECK IF IT EXISTS
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith(`Bearer`)
  ) {
    token = req.headers.authorization.split(` `)[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //   console.log(token);
  if (!token) {
    return next(new AppError(`You are not logged in.`, 401));
  }
  //2. VERIFY TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //VERIFY IS AN ASYNC FUNCTION
  //   console.log(decoded);

  //3. CHECK IF USER STILL EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(`The user with this token no longer exists.`, 401)
    );
  }

  //4. CHECK IF USER CHANGED PASSWORD AFTER JWT ISSUED
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(`User recently changed password. Please login again.`, 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//ONLY FOR RENDERING PAGES, NO NEED FOR ERRORS
exports.isLoggedIn = async (req, res, next) => {
  //1. GET TOKEN AND CHECK IF IT EXISTS
  if (req.cookies.jwt) {
    try {
      //2. VERIFY TOKEN
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      ); //VERIFY IS AN ASYNC FUNCTION

      //3. CHECK IF USER STILL EXISTS
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //4. CHECK IF USER CHANGED PASSWORD AFTER JWT ISSUED
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //ROLES IS AN ARRAY
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`You do not have permission to perform this action.`, 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(`There is no user with that email address.`, 404));
  }
  //2. GENERATE RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken(); //MODIFIED IT
  await user.save({ validateBeforeSave: false }); //SAVE IT - MIDDLEWARE IN SCHEMA

  //MOVED TO PUG
  // const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password then ignore this email.`;

  try {
    //3. SEND IT TO USER'S EMAIL
    const resetURL = `${req.protocol}://${req.get(
      `host`
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: `Your password reset token (valid for 10 minutes.)`,
    //   message
    // });
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: `success`,
      message: `Token sent to email.`
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(`There was an error sending the email. Try again later.`),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash(`sha256`)
    .update(req.params.token)
    .digest(`hex`);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2. IF TOKEN NOT EXPIRED AND USER EXISTS, SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError(`Token is invalid or has expired`), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //3. UPDATE changedPasswordAt PROPERTY FOR USER
  await user.save(); //INCLUDED IN SCHEMA MIDDLEWARE
  //4. LOG USER IN, SEND JWT
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);

  // res.status(201).json({
  //   status: `success`,
  //   token
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select(`+password`); //ASK FOR PASSWORD, DEFINED IN SCHEMA
  //2. CHECK IF POSTED CURRENT PASSWORD CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError(`The password entered is incorrect.`, 401));
  }
  //3. IF SO, UPDATE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4. LOG USER IN, SEND JWT
  createSendToken(user, 200, req, res);
});
