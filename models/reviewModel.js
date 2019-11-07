const mongoose = require(`mongoose`);
const Tour = require(`./tourModel`);

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, `Review cannot be empty.`]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: `Tour`, //USE SAME ON PATH FOR PRE MIDDLEWARE, ETC
      required: [true, `Review must belong to a tour.`]
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: `User`,
      required: [true, `Review must belong to a user.`]
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//COMPOUND INDEX TO FIND IF TOUR AND USER REVIEW IS UNIQUE
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: `tour`, //USE SAME AS REF ON SCHEMA
  //   select: `name` //PUT RELEVANT INFO YOU WANT TO SHOW
  // }).populate({
  //   path: `user`,
  //   select: `name photo`
  // });
  this.populate({
    path: `user`,
    select: `name photo`
  });
  next();
});

//CALCULATE AVG RATINGS AUTOMATICALLY
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: `$tour`,
        nRating: { $sum: 1 },
        avgRating: { $avg: `$rating` }
      }
    }
  ]);
  //PERSIST INTO TOURS
  if (stats.length > 0) {
    //ONLY CALC AVG IF THERE IS A REVIEW
    await Tour.findByIdAndUpdate({
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate({
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post(`save`, function() {
  //THIS POINTS TO CURRENT REVIEW
  this.constructor.calcAverageRatings(this.tour); //TRICK FOR Review.calcAverageRatings(this.tour) BEFORE STATING REVIEW
});

//UPDATE AVG RATINGS EVEN AFTER USER UPDATES THEIR RATING OR DELETES IT
//TRICK TO GO AROUND QUERY MIDDLE WARE TO ACCESS DOCUMENT
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne(); //SET REVIEW TO THIS.R TO SAVE THE REVIEW
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //await this.findOne(); DOES NOT WORK HERE SINCE QUERY HAS ALREADY EXECUTED
  await this.r.constructor.calcAverageRatings(this.r);
});

const Review = mongoose.model(`Review`, reviewSchema);

module.exports = Review;
