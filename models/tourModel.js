const mongoose = require(`mongoose`);
const slugify = require(`slugify`);
// const User = require(`./userModel`);
// const validator = require(`validator`);

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, `A tour must have a name.`], //SECOND IS THE ERROR
      unique: true,
      trim: true,
      maxlength: [40, `A tour name must have less or equal to 40 characters`],
      minlength: [10, `A tour name must have more or equal to 10 characters.`]
      // validate: [validator.isAlpha, `Tour name must only contain characters.`]
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, `A tour must have a duration.`]
    },
    maxGroupSize: {
      type: Number,
      required: [true, `A tour must have a group size.`]
    },
    difficulty: {
      type: String,
      required: [true, `A tour must have a difficulty.`],
      enum: {
        //TO SET ERROR MESSAGES
        values: [`easy`, `medium`, `difficult`],
        message: `Difficulty is either: easy, medium, or difficult.`
      }
    },
    ratingsAverage: {
      type: Number,
      default: 3,
      min: [1, `Rating must be above 1.0`],
      max: [5, `Rating must be below 5.0`],
      set: val => Math.round(val * 10) / 10 //ROUND TO NEAREST TENTH
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, `A tour must have a price.`]
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //.this ONLY POINTS TO CURRENT DOC ON NEW DOC CREATION
          return val < this.price; // PRICE DISCOUNT SHOULD ALWAYS BE LOWER
        }, //HOW TO USE VALUE IN MESSAGE
        message: `Discount price ({VALUE}) should be below regular price.`
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, `A tour must have a description.`]
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, `A tour must have a cover image.`]
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false //HIDES PROPERTY
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: `Point`,
        enum: [`Point`]
      },
      coordinates: [Number], //EXPECT AN ARRAY WITH NUMBERS
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: `Point`,
          enum: [`Point`]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      //Array //EMBEDDING GUIDES => TOURS
      {
        //TOURS CHILD REFERENCING => GUIDES
        type: mongoose.Schema.ObjectId,
        ref: `User`
      }
    ]
  },
  {
    toJSON: { virtuals: true }, //NECESSARY FOR VIRTUAL PROPERTIES (CLIENT SIDE)
    toObject: { virtuals: true } //SAME AS ABOVE
  }
);

//INDEXES (MAKES READ PERFORMANCES BETTER)
// tourSchema.index({ price: 1 }); //SORT PRICE IN ASCENDING ORDER (-1 FOR DESCENDING)
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: `2dsphere` }); //TELL MONGODB TO USE 2DSPHERE

//VIRTUAL PROPERTY
tourSchema.virtual(`durationWeeks`).get(function() {
  return this.duration / 7; //MUST BE A REGULAR FUNCTION TO HAVE THIS.
});

//VIRTUAL POPULATE
tourSchema.virtual(`reviews`, {
  ref: `Review`,
  foreignField: `tour`, //CALLED TOUR IN REVIEW MODEL
  localField: `_id` //ONLY FOR QUERIES WITH ID?
});

//DOCUMENT MIDDLEWARE: PREVIEWS DOCUMENT / RUNS BEFORE .save() AND .create()
tourSchema.pre(`save`, function(next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

//EMBEDDING GUIDES TO TOURS
// tourSchema.pre(`save`, async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// //QUERY MIDDLEWARE (WORKS BEFORE TOUR.FIND)
// tourSchema.pre(`find`, function(next) {
//   this.find({ secretTour: {$ne: true} }); //FIND TOURS NOT EQUAL TO SECRET TOUR
//   next();
// })

//QUERY MIDDLEWARES (PRE - WORKS BEFORE ALL TOUR.FIND...)
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } }); //FIND TOURS NOT EQUAL TO SECRET TOUR
  this.start = Date.now();
  next();
});
//SHOW GUIDES, ETC ON TOUR
tourSchema.pre(/^find/, function(next) {
  this.populate({
    //POPULATE FILLS UP GUIDES FIELD
    path: `guides`,
    select: `-__v -passwordChangedAt` //- REMOVES SELECTED VARIABLES
  });
  next();
});

//QUERY BENCHMARK - RUNS AFTER QUERY IS FINISHED
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds.`);
  console.log(docs);
  next();
});

//HIDDEN TO ENABLE GEONEAR FIRST STAGE IN PIPELINE
//AGGREGATION MIDDLEWARE (HIDE TOUR SECRETS FROM MISC SEARCHES)
// tourSchema.pre(`aggregate`, function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

// tourSchema.post(`save`, function(doc, next) {
//   console.log(doc);
//   next();
// })

// //PRE-SAVE BOOK/MIDDLEWARE
// tourSchema.pre(`save`, function(next) {
//   console.log(`Will save tour.`)
//   next();
// })

const Tour = mongoose.model(`Tour`, tourSchema);

module.exports = Tour;
