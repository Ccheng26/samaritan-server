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
  console.log(req.body)
  var users = req.session.user;
  db.tx(function*(t) {
    let organizations = yield t.none("INSERT INTO organizations (orgId, name, address1, address2, city, mission, emailid) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING", [databody.orgId, databody.name, databody.address1, databody.address2, databody.city, databody.mission, users.id])
        yield t.none("INSERT INTO pledges (organid, pledge) VALUES ($1, $2)", [databody.orgId, databody.pledge]);
    }).then(()=>{
      console.log("yay")
    }).catch(error =>{
      console.log(error)
      db.none("INSERT INTO pledges (organid, pledge) VALUES ($1, $2)", [databody.orgId, databody.pledge]);
    })
  res.render('index')
})


app.get('/save', function(req,res){
  var users = req.session.user;
  var logged_in = true;
  console.log('save route')
  db.task(function*(t){
    return t.many("SELECT * FROM organizations WHERE emailid = $1", users.id)
    .then(org=> {
      return t.any("SELECT * FROM pledges WHERE organid=$1", org.orgid)
      // return t.many("SELECT * FROM pledges WHERE organid=$1", [org.orgid])
    })
  }).then(function(data){
    var search= {organizations:data};
    console.log("check if this is working")
    console.log(search)
    res.render('index', search);
  })
})

app.get('/home', function(req,res){
  console.log('see saved donations')
  var logged_in = true;
  // var donationList = {
  //   "logged_in": logged_in
  // }
  var arr = []
  db.task(function(t){
    return t.many("SELECT * FROM organizations WHERE organizations.emailid = $1", [req.session.user.id])
  .then(function(org){
    console.log("here")
    console.log(org)
    org.forEach(function(id){
      arr.push(id.orgid)
      // return t.any("SELECT * FROM pledges WHERE organid = (SELECT organid FROM organizations WHERE orgid = $1", [id.orgid])
    })
    var donationList = {
      "organizations": org,
      "logged_in": logged_in,
      "donations": arr
    }
    console.log(donationList)
      }).then(function(f){
      console.log(f)
    })

    console.log(donationList)
  res.render('index', donationList);
  })
  .catch(function(err){
    console.log(err)
    console.log('did not work')
    res.redirect('/')
  })
})




app.delete('/pledges/:id',function(req,res){
  var id = req.params.id
  console.log(id)
  db.none("DELETE FROM pledges WHERE id= $1", [id]).then(function(){
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
  var search = req.body.search
  // fetch('http://localhost:9000/search')
  //   .then(function(response) {
  // checks if sessions are logged in
  if(req.session.user) logged_in = true;
    var logged_in;
    var logs = {
      logged_in: logged_in,
      user: req.session.user,
      search: []
    };
  const key = process.env.OKEY
  const key2= process.env.OKEYY
  const key4= `${key} ${key2}`
  console.log(key4)
  console.log('search:' + search)
    // https://quickstartdata.guidestar.org/v1/quickstartsearch

  var org_url =`https://Sandboxdata.guidestar.org/v1_1/search.json?q=${search}`
  var fetch_more_url = `https://Sandboxdata.guidestar.org/v1/detail/`
  // define fetch request here, then return a json response, don't nest a bunch of response.json requests, headers will read twice and fetch will get mad with promise handling
  var fetchJson = function(url) {
    return fetch(url, { headers: { 'Authorization': key4 }})
    .then(function(response) {
        return response.json()
      });
  };
  // handle secondary fetch request here, will pull orgainzation_id from initial fetch and plug into second api, return json again and pull information out
  //solution credit from Tims Gardner and Fuse forum
  //https://www.fusetools.com/community/forums/howto_discussions/problem_with_fetch?page=1&highlight=259c897c-6627-4a46-9911-1cfad8cd6071#post-259c897c-6627-4a46-9911-1cfad8cd6071
  var createOrgAsync = function(organization, index) {
    // console.log(organization)
    var moreinfoUrl = fetch_more_url + organization.organization_id + ".json";
    // console.log(moreinfoUrl)
    return fetchJson(moreinfoUrl).then(function(moreinfo) {
      return {
        orgId: organization.organization_id,
        name: organization.organization_name,
        address1: moreinfo.address_line1,
        address2: moreinfo.address_line2,
        city: moreinfo.city + ", " + moreinfo.state + " " + moreinfo.zip,
        mission: moreinfo.mission,
        website: moreinfo.website
        }
      });
  }
  // calls initial function, runs with the first api, maps the information in the second function, and returns all information. pushes all the rematining information into an array, then renders
  fetchJson(org_url, { headers: { 'Authorization': key4 }})
    .then(function(responseObject) {
      return responseObject.hits.map(createOrgAsync); })
    .then(function(promises) { return Promise.all(promises); }) // Wait for all orgs to fetch more info
    .then(function(orgs) {
        orgs.map(function(m) {
            logs.search.push(m) // Add to array
        });
      // console.log("check data")
      // console.log(logs)
      res.render('results',logs)
    })
    // .catch(function(e) { console.log('Fetch Error :-S', e); })
  })

app.get('/search', function(req, res){
  res.render('index');
});


// router.get('/search', function(req, res) {
//   res.json({data: data});
// });

// module.exports = router;
