const mongoose = require(`mongoose`);
const dotenv = require(`dotenv`);

process.on(`uncaughtException`, err => {
  console.log('Uncaught excepction. Shutting down...');
  console.log(err.name, err.message);
  process.exit(1); //1 STANDS FOR UNCALLED EXCEPTION, 0 FOR SUCCESS
});

//FOR UNCAUGHT EXCEPTION
// console.log(x);

dotenv.config({ path: `./config.env` }); //READ ENVIRONMENT VARIABLE BEFORE APPLICATION
const app = require(`./app`);

const DB = process.env.DATABASE.replace(
  `<PASSWORD>`,
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    //MONGODB ATLAS
    //.connect(process.env.DATABASE_LOCAL, { //IN COMPUTER
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true //DEPRECATION WARNING UPDATE
  })
  .then(() /*con*/ => {
    //CONNECT
    //console.log(con.connections);
    console.log(`DB connection successful!`);
  });

//TEMPLATE FOR DATA
// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, `A tour must have a name.`], //SECOND IS THE ERROR
//     unique: true
//   },
//   rating: {
//     type: Number,
//     default: 3
//   },
//   price: {
//     type: Number,
//     required: [true, `A tour must have a price.`]
//   }
// });

// const Tour = mongoose.model(`Tour`, tourSchema);

// const testTour = new Tour({
//   name: `The Park Camper`,
//   price: 997
// })

// testTour.save().then(doc => {
//   console.log(doc);
// }).catch(err => {
//   console.log(`Error: ${err}`);
// }); //SAVES TO THE DATABASE

// console.log(app.get(`env`)); //ENVIRONMENT VARIABLE (DEVELOPMENT, ETC.)
// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//LISTEN TO EVENT (EX. DB PW WRONG IN CONFIG.ENV)
process.on('unhandledRejection', err => {
  console.log('Unhandled rejection. Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); //1 STANDS FOR UNCALLED EXCEPTION, 0 FOR SUCCESS
  });
});

//SIGTERM IS SIGNAL FROM HEROKU SENT TO THE APP TO SHUTDOWN DAILY
process.on(`SIGTERM`, () => {
  console.log(`SIGTERM RECEIVED. Shutting down gracefully.`);
  server.close(() => {
    console.log(`Process terminated.`);
  });
});
