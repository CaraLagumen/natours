const AppError = require(`./../utils/appError`);

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join(` `)}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError(`Invalid token. Please log in again.`, 401);

const handleJWTExpiredError = () =>
  new AppError(`Token expired. Please log in again.`, 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith(`/api`)) {
    //API
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    console.log(`Error.`, err);
    //RENDERED WEBSITE
    return res.status(err.statusCode).render(`error`, {
      title: `Something went wrong.`,
      msg: err.message
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith(`/api`)) {
    //API
    //OPERATIONAL ERROR, TRUSTED ERROR: SEND MESSAGE TO CLIENT
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //PROGRAMMING OR OTHER UNKNOWN ERROR: DON'T LEAK ERROR DETAILS
    //1. LOG ERROR
    console.log(`Error.`, err);
    //2. SEND GENERIC MESSAGE
    return res.status(500).json({
      status: `error`,
      message: `Something went very wrong.`
    });
  }
  //RENDERED WEBSITE
  //OPERATIONAL ERROR, TRUSTED ERROR: SEND MESSAGE TO CLIENT
  if (err.isOperational) {
    return res.status(err.statusCode).render(`error`, {
      title: `Something went wrong.`,
      msg: err.message
    });
  }
  //PROGRAMMING OR OTHER UNKNOWN ERROR: DON'T LEAK ERROR DETAILS
  //1. LOG ERROR
  console.log(`Error.`, err);
  //2. SEND GENERIC MESSAGE
  return res.status(500).json({
    status: `error`,
    msg: `Try again later.`
  });
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;

  if (process.env.NODE_ENV === `development`) {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === `production`) {
    // console.log(`Production error controller working.`);
    let error = { ...err };
    error.message = err.message;

    if (error.name === `CastError`) error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === `ValidationError`)
      error = handleValidationErrorDB(error);
    if (error.name === `JsonWebTokenError`) error = handleJWTError();
    if (error.name === `TokenExpiredError`) error = handleJWTExpired();
    sendErrorProd(error, req, res);
  }
};
