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
  if(req.session.user) logged_in = true;
    var logged_in;
    var logs = {
      logged_in: logged_in,
      user: req.session.user,
      search: []
    };
    const key = process.env.OKEY
    const key2= process.env.OKEYY
    const key3= key + " " + key2
    const key4= `${key} ${key2}`
    console.log(key4)
    console.log('search:' + search)
    // https://quickstartdata.guidestar.org/v1/quickstartsearch

  var org_url =`https://Sandboxdata.guidestar.org/v1_1/search.json?q=${search}`
  var fetch_more_url = `https://Sandboxdata.guidestar.org/v1/detail/`
  var fetchJson = function(url) {
    return fetch(url, { headers: { 'Authorization': key4 }})
    .then(function(response) {
        return response.json()
      });
  };

  var createOrgAsync = function(organization, index) {
    console.log(organization)
    var moreinfoUrl = fetch_more_url + organization.organization_id + ".json";
    console.log("check here")
    console.log(moreinfoUrl)
    return fetchJson(moreinfoUrl).then(function(moreinfo) {
        return {
            orgID: organization.organization_id,
            name: organization.organization_name,
            address: moreinfo.address_line1,
            address2: moreinfo.address_line2,
            city: moreinfo.city + ", " + moreinfo.state + " " + moreinfo.zip,
            mission: moreinfo.mission,
            website: moreinfo.website
            }
        });
    }
  fetchJson(org_url, { headers: { 'Authorization': key4 }})
    .then(function(responseObject) {
      console.log("object response is here")
      console.log(responseObject.hits)
      return responseObject.hits.map(createOrgAsync); })
    .then(function(promises) { return Promise.all(promises); }) // Wait for all orgs to fetch more info
    .then(function(orgs) {
        orgs.map(function(m) {
            logs.search.push(m) // Add to array
        });
        console.log("check data")
        console.log(logs)
        // console.log(logs)
        // res.render('results', logs)
     res.render('results',logs)
    })
    // .catch(function(e) { console.log('Fetch Error :-S', e); })


  })

app.get('/search', function(req, res){
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
