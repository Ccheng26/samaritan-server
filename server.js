'use strict';

const express = require('express'),
  app = express(),
  PORT = process.env.PORT || 9000,
  pgp = require('pg-promise')(),
  db = pgp(process.env.DATABASE_URL || 'postgres://student_03@localhost:5432/samaritan'),
  session = require('express-session'),
  bcrypt = require('bcryptjs'),
  fetch = require('node-fetch'),
  bodyParser = require('body-parser'),
  router = express.Router(),
  mustache = require('mustache-express'),
  metOver= require('method-override'),
  dotenv = require('dotenv');

// to use process.env with webpack, variable storage
dotenv.config({ path: 'config.env' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// port logging
app.listen(
  PORT, () => { console.log(`App listening on port ${PORT}!`)
})

app.engine('html', mustache());
app.set('view engine','html');
app.set('views', __dirname + '/views');
app.use('/', express.static(__dirname+ '/'))
app.set('css', __dirname + '/public');
app.set('js', __dirname + '/public');;
app.use(metOver('_method'));
// app.use(bodyParser.urlencoded({ extended: false}));
// app.use(bodyParser.json());

const some = process.env.SECRET
app.use(session({
  secret: some,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


var something = []
app.get("/", function(req,res){
  var logged_in;
  var email;

  if(req.session.user){
    logged_in = true;
    email = req.session.user.email;
  }
  var data = {
    "logged_in" :logged_in,
    "email": email
  }
  res.render('index',data)
})

app.post('/signup',function(req,res){
  var data = req.body
  bcrypt.hash(data.password, 10, function(err,hash){
    db.none(
      "INSERT INTO users (name, username, email, password_digest) VALUES ($1, $2, $3, $4)",
      [data.fullname, data.username, data.email, hash])
    .then(function(){
      res.render('index')
    })
  })
})
app.get('/signup', function(req,res){
  res.render('signup')
})
app.post('/login', function(req,res){
  var data= req.body;
  db.one("SELECT * FROM users WHERE email =$1", [data.email])
  .catch(function(){
    res.send('Email/Password not found.')
  }).then(function(user){
    bcrypt.compare(data.password, user.password_digest, function(err,cmp){
      if(cmp){
        req.session.user = user;
        res.redirect('/home')
      } else {
        res.send('Email/Password not found')
      }
    })
  })
})

app.get('/logout',function(req, res){
  res.render('index')
})
app.post('/save',function(req,res){
  var databody = req.body;
  var users = req.session.user;
  db.none("INSERT INTO organizations (name, address, emailid) VALUES ($1, $2, $3)", [databody.name, databody.address, users.id]);
  res.render('index')
})

app.get('/save', function(req,res){
  db.many("SELECT * FROM organizations").then(function(data){
    var search= {organizations:data};
    res.render('index', search);
  })
})

app.get('/home', function(req,res){
  console.log('see saved donations')
  db.many("SELECT * FROM organizations WHERE organizations.emailid = $1", [req.session.user.id]).then(function(data){
    var logged_in = true;
    var donationList = {
      "organizations": data,
      "logged_in": logged_in
    }
  res.render('index', donationList);
  }).catch(function(){
    res.redirect('/')
  })
})

app.delete('/organizations/:id',function(req,res){
  id = req.params.id
  db.none("DELETE FROM organizations WHERE id= $1", [id]).then(function(){
    res.redirect('/home')
  })
})
app.get('/user',function(req,res){
  db.many("SELECT * FROM users WHERE id = $1", [req.session.user.id]).then(function(data){
      var logged_in =true;
      var userData= {
      "users": data,
      "logged_in": logged_in
      }
    // console.log(userData);
    res.render('user', userData);})
})
app.put('/user/:id',function(req,res){
  user= req.body
  id= req.params.id
  db.none("UPDATE users SET name=$1, username =$2 WHERE id = $3",
    [user.name, user.username, id]);
  res.redirect('/home')
})

// request for search parameter and plug into the api
app.post('/search', function(req, res, next) {
  // var search = req.query.search;
  var search = req.body.search
    // var SearchForm = React.renderToString(SearchFormFactory());
    // res.render('index', { Content: SearchForm});
  // fetch('http://localhost:9000/search')
  //   .then(function(response) {
    const key = process.env.OKEY
    const key2= process.env.OKEYY
    const key3= key + " " + key2
    const key4= `${key} ${key2}`
    console.log(key4)
    console.log('search:' + search)
    // https://quickstartdata.guidestar.org/v1/quickstartsearch

    fetch(`https://Sandboxdata.guidestar.org/v1_1/search.json?q=${search}`, { headers: { 'Authorization': key4 }
    }).then(
        function(response) { // check if fetch request goes through
          if (response.status !== 200) { // if not successful, error
          console.log(`Error Status Code: ${response.status}`);}
          return response.json().then(function(data) {
          // if response is 200, check data
          var parse = data.hits
          //define logs up here. Push data to logs.search
          var logged_in;
          if(req.session.user) logged_in = true;
            var logs = {
              logged_in: logged_in,
              user: req.session.user,
              search: []
            };
          parse.forEach(function(e) {
            var orgId = e.organization_id
            //https://quickstartdata.guidestar.org/v1/quickstartdetail/
            fetch(`https://Sandboxdata.guidestar.org/v1/detail/${orgId}.json`, { headers: { 'Authorization': key4 }
          }).then(function(item) {
              item.json()
              .then(function(oData) {
                console.log(oData)
                  var arr = []
                  arr.push(oData)
                  arr.forEach(function(f) {
                    var orgName = f.organization_name
                    var address = `${f.address_line1} ${f.address_line2}`
                    var address2 = `${f.city}, ${f.state}, ${f.zip}`
                    var programss = f.programs.forEach(function(g) { arr.push(arr.program = g.programdescription)})
                  var program = arr.program
                  //var aka = f.aka_organizaton_name
                  var mission = f.mission
                  logs.search.push({
                      name: orgName,
                      add1: address,
                      add2: address2,
                      mission: mission,
                      program: program
                  });

                  console.log("~~~~~~~~~~~~~~~~")
                  console.log(logs)
                  res.render('results',logs)

                })

              })

            })

          })
      //     .catch(function(err) {
      //   // if error with guidestar fetch request
      //   console.log('Fetch Error :-S', err); // log the error
      // })
    })
          next();
     //      .catch(function(err) {
     // // if error with the route fetch request
     //  console.log('Fetch Error :-S', err);
     //  })
    })
    // next();
  })
// })

app.get('/results', function(req, res){
  var user, logged_in;
  if(req.session.user){ // storing info for header.html
    user = req.session.user;
    logged_in = true;
  }
  var logs = {
    logged_in : logged_in,
    id : user
  };
  res.render('results', logs);
});


// router.get('/search', function(req, res) {
//   res.json({data: data});
// });

// module.exports = router;
