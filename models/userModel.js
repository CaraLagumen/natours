const crypto = require(`crypto`);
const mongoose = require(`mongoose`);
const validator = require(`validator`);
const bcrypt = require(`bcryptjs`);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `Name required.`]
  },
  email: {
    type: String,
    required: [true, `Email required.`],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, `Email invalid.`]
  },
  photo: { type: String, default: `default.jpg` },
  role: {
    type: String,
    enum: [`user`, `guide`, `lead-guide`, `admin`],
    default: `user`
  },
  password: {
    type: String,
    required: [true, `Password required.`],
    minlength: 8,
    select: false //HIDE IT
  },
  passwordConfirm: {
    type: String,
    required: [true, `Confirm your password.`],
    validate: {
      //THIS ONLY WORKS ON CREATE AND SAVE
      validator: function(el) {
        return el === this.password; //PASSWORD === PASSWORD
      },
      message: `Passwords are not the same.`
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//ENCRYPT PASSWORD MIDDLEWARE
userSchema.pre(`save`, async function(next) {
  //ONLY RUN IF PASSWORD MODIFIED
  if (!this.isModified(`password`)) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; //DELETE THE PASSWORDCONFIRM FOR SECURITY
  next();
});

//RESET PASSWORD MIDDLEWARE
userSchema.pre(`save`, function(next) {
  if (!this.isModified(`password`) || this.isNew) return next(); //IF NOT MODIFIED OR NEW, MOVE ON
  this.passwordChangedAt = Date.now(); //COMPARING TIMESTAMP ON JWT IN AUTHCONTROLLER
  next();
});

//HIDE USER WHEN DELETED MIDDLEWARE
userSchema.pre(/^find/, function(next) {
  //THIS POINTS TO CURRENT QUERY
  this.find({ active: { $ne: false } }); //NOT EQUAL TO FALSE
  next();
});

//INSTANCE METHOD (AVAILABLE TO ALL DOCUMENTS)
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  //COMPARE ENCRYPTED ENTERED PASS TO ENCRYPTED SAVED PASS
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  //CHECK ONLY IF PASSWORD WAS CHANGED
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString(`hex`); //ACTS LIKE A PASSWORD

  this.passwordResetToken = crypto
    .createHash(`sha256`)
    .update(resetToken)
    .digest(`hex`);

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

//MODEL VARIABLES ALWAYS START WITH A CAPITAL LETER
const User = mongoose.model(`User`, userSchema);

module.exports = User;
