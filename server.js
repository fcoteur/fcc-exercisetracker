const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
var shortid = require('shortid');

// connect to db and setup
const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to the database!');
});
const exerciseSchema = new mongoose.Schema({description: String, duration: Number, date: Date});
const trackerSchema = new mongoose.Schema({
  shortId: {type: String, unique: true, default: shortid.generate},
  username: String,
  exercises: [exerciseSchema]
});
const User = mongoose.model('User', trackerSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {  
  // check if username exists and dave it
  let query = {};
  query.username = req.body.username;
  User.find(query, (err,docs) => {
    if (docs.length) {
      res.json('user already taken');
    } else {
      let user = new User();
      user.username = req.body.username;
      user.save(function (err, user) {
        if (err) return console.error(err);
        res.json(user);
      });
    } 
  });
});

app.post('/api/exercise/add', (req, res) => {  
  let query = {};
  query.shortId = req.body.userId;
 
  User.findOne(query, (err,doc) => {
    if (err) return console.error(err);
    if (doc) { 
    let exercise ={};
    exercise.description = req.body.description;
    exercise.duration = req.body.duration;
    exercise.date = req.body.date;
    let nextIndex = doc.exercises.length
    doc.exercises[nextIndex]= exercise;
    doc.save((err,doc) => {
      if (err) return console.error(err);
      res.json(doc);
    });
    } else {
      res.json('userid not found!');
    }
  
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
