'use strict';

const app = require('./app'),
  PORT = process.env.PORT || 9000,
  pgp = require('pg-promise'),
  //db = pgp(process.env.DATABASE_URL || 'postgres://student_03@localhost:5432/samaritan'),
  session = require('express-session'),
  bcrypt = require('bcryptjs'),
  fetch = require('node-fetch'),
  dotenv = require('dotenv'),
  bodyParser = require('body-parser'),
  express = require('express'),
  router = express.Router();

// to use process.env with webpack, variable storage
dotenv.config({ path: 'config.env' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// port logging
app.listen(
  PORT, () => { console.log(`App listening on port ${PORT}!`)
})

// searching through propublica
//'https://projects.propublica.org/nonprofits/api/v2/search.json?q=' + searchQuery + 'c_code%5Bid%5D=3'
//
//guidestar
// 'https://quickstartdata.guidestar.org/v1/quickstartsearch?q=keyword:' + Query

// app.get('/search', function (req,res) {
//   var search = req.body.search;
//   // var SearchForm = React.renderToString(SearchFormFactory());
//   // res.render('index', { Content: SearchForm});
//   fetch('localhost:3000')
//   .then(function(response){
//     return response.text()
//     console.log(response)
//     console.log("wheeeee")
//   })
//   res.render('index',data)
// });

// array for stroage
var something = [];
var somethingDetail = [];

// request for search parameter and plug into the api
app.post('/search', function(req, res) {
  // var search = req.query.search;
  var search = req.body.search
    // var SearchForm = React.renderToString(SearchFormFactory());
    // res.render('index', { Content: SearchForm});
  fetch('http://localhost:9000/search')
    .then(function(response) {
    const key = process.env.GUIDESTAR + " " + process.env.KEY
    const skey = process.env.OKEY + " " + process.env.OKEYY
    console.log(search)
    // https://quickstartdata.guidestar.org/v1/quickstartsearch
    fetch(`https://Sandboxdata.guidestar.org/v1_1/search.json?q=${search}`, { headers: { 'Authorization': `${skey}` }
    }).then(
        function(response) { // check if fetch request goes through
          if (response.status !== 200) { // if not successful, error
          console.log(`Error Status Code: ${response.status}`);}
          response.json().then(function(data) {
          // if response is 200, check data
          var parse = data.hits
          parse.forEach(function(e) {
            var orgId = e.organization_id
            //https://quickstartdata.guidestar.org/v1/quickstartdetail/
            fetch(`https://Sandboxdata.guidestar.org/v1/detail/${orgId}.json`, { headers: {'Authorization': `${skey}`}
            }).then(function(response) {
              response.json().then(function(oData) {
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
                something.push({
                    name: orgName,
                    add1: address,
                    add2: address2,
                    mission: mission,
                    program: program
                  });
                })
              })
            })
          }).catch(function(err) {
        // if error with guidestar fetch request
        console.log('Fetch Error :-S', err); // log the error
      })
    }).catch(function(error) {
     // if error with the route fetch request
      console.log('Fetch Error :-S', error);
      })
    })
  })
})

app.get('/search', function(req, res) {
 console.log(something)
 res.send(something);
})


// router.get('/search', function(req, res) {
//   res.json({data: data});
// });

module.exports = router;

