# Samaritan

**User Stories**

With impending budget cuts to government support agencies, I want to find a way to help those in need.

![Alt text](http://i.imgur.com/UwnoTVA.png "Screenshot")

**Technologies Used**:
+ NodeJS
 + PG Promise
 + Express
 + Fetch
 + Body Parser
 + Method Override
+ CSS
 + Bootstrap
+ Guidestar API

**Installation Instructions**
 ```bash
# Clone this repository
git clone git@github.com:ccheng26/samaritan-server.git
# Go into the repository
cd samaritan-server
# Install dependencies
npm install
# Run the app
node server
```

**The Approach Taken**:
+ Considered user story, compiled a list of APIs and sorted through information
+ Basic React setup
+ Established ERDs, then [wireframed](http://i.imgur.com/mIbvcaL.jpg), more wireframing [here](http://i.imgur.com/gnLZa0Q.jpg)
+ Began working on Express
 + Spent a lot of time figuring out how to make Express work with React
 + Had webpack break a bunch of things, then seperated server file
 + More debugging, redrew [ERD](http://i.imgur.com/kaBMz3o.jpg)
 + Spent a lot more time than I should've figuring out how to render data only through the backend
+ Ended up with only a Node App

**Unsolved Problems/Major Hurdles**

Approaching Back and Front End compilation was a major time drainer. See To Do List.

**To Do**:
+ Implement a volunteering API
+ Connect this application to React.js
+ Debug the table errors

Special Thanks to the Developers at Guidestar, the Stack Overflow community.
