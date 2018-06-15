const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({

  key: 'user',
  secret: 'SECret'

}))
app.use(express.static("views"));



//set initial user and url databases to test

const urlDatabase = {
  "b2xVn2": {
    'longURL': "http://www.lighthouselabs.ca",
    'userID': '322w55ekh7g'
  },
  "9sm5xk": {
    'longURL': "http://www.google.com",
    'userID': 'do1r53g7xat'
  }
};

    //I KNOW PASSWORDS SHOULDN'T BE STORED LIKE THIS BUT
    //I WANTED SOME DEFAULT USERS IN HERE FOR TESTING :)
const users ={
  "322w55ekh7g": {
    id: "322w55ekh7g",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "do1r53g7xat": {
    id: "do1r53g7xat",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}




//functions

  // to generate unique shortURLS
const generateShortUrl = function(){
  const uniqueKey = Math.random().toString(36).replace('0.','').split('').slice(0,6).join('');
  return uniqueKey;
}

  //to generate unique user IDs
const generateRandomUserId = function(){
  const uniqueKey = Math.random().toString(36).replace('0.','').split('').slice(0,12).join('');
  return uniqueKey;
}

  //check if email is already registered
const isNotUniqueEmail = function(newEmail){
  let keys = Object.keys(users);
  var flag = false
  keys.forEach( function(key) {
    if(users[key]['email'] === newEmail){
      flag = true;
    }
  })
  return flag;
}

  //render error page
const make404 = function(res){
  res.status(400).render('404.ejs')
}

  //find user associated with email & password
const findUser = function(email, password) {
  let keys = Object.keys(users);
  let userId = keys.filter(key => users[key]['email'] === email).toString();
  //check if password matches password stored for that user
  if(!userId){
    return null;
  } else if(bcrypt.compareSync(password, users[userId]['password'])){
    return users[userId];
  }
  else {
    return null;
  }
}

  //get all the urls associated with a given user
const getUsersUrls = function(userID) {
  let availableUrls = {};
  let urlKeys = Object.keys(urlDatabase);
  for(let key of urlKeys){
    if (urlDatabase[key]['userID'] === userID){
      availableUrls[key] = {
        'longURL': urlDatabase[key]['longURL'],
        'userID': urlDatabase[key]['userID']
      }
    }
  }
  return availableUrls;
}





//GET method routes

app.get("/", (req, res) => {
  res.redirect('/login');
});

  //list all urls associated with current user
app.get('/urls', (req, res) => {

  //require login
  if (req.session.user) {

    //if someone is logged in, find all of the urls with their id
    let currUserID = req.session['user']['id'];
    let currUrls = getUsersUrls(currUserID);

    //get all users available urls --> send them to the render/template!
    let templateVars = {
      user: req.session["user"],
      urls: currUrls
    };

    res.render('urls_index.ejs', templateVars)

  } else{

    //if no one is logged in, redirect to login page
    res.redirect('/login');
  }
})

  //add a new url (submit a url to be shrunk)
app.get('/urls/new', (req, res) => {

  //require login
  if (req.session.user) {


    let templateVars = {
      user: req.session["user"],
    }

    res.render('urls_new.ejs', templateVars);

  } else {

    //if no one is logged in, redirect to login page
    res.redirect('/login');
  }
})

  //look at a specific shruken url and it's long version
app.get('/urls/:id', (req, res) => {

  //require login
  if (req.session.user) {

    //check if id belongs to them - do they have access to this url?/do their IDs match?
    const shortUrlKey = req.params.id

    if(Object.keys(urlDatabase).indexOf(shortUrlKey) < 0){

      //if specified shruken url doesn't exist, redirect to available urls page
      res.redirect('/urls');

    } else if(urlDatabase[shortUrlKey]['userID'] === req.session['user']['id']){

      //if IDs, render page/allow access
      let templateVars = {
        user: req.session["user"],
        shortURL: shortUrlKey,
        longURL: urlDatabase[shortUrlKey]['longURL']
      };

      res.render('urls_show.ejs', templateVars)

    } else {

      //if IDs don't match, redirect to their available urls page
      res.redirect('/urls');
    }

  } else {

    //redirect if not logged in
    res.redirect('/login');
  }
})

  //look at database as json object - first/test page
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})

  //test page
app.get('/hello', (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

  //redirect to the corresponding long url of specified shrunken url
app.get("/u/:shortURL", (req, res) => {

  //SHOULD NOT REQUIRE LOGIN, can be viewed by anybody
  let longURL = urlDatabase[req.params.shortURL]['longURL'];

  //redirect to the long url/original site
  res.redirect(longURL)
})

  //displays registration form
app.get('/register', (req, res) => {

  res.render('register.ejs');
})

  //displays login form
app.get('/login', (req, res) => {

  res.render('login.ejs');
})







//POST method routes

  //posted after creating new url to be shortened
app.post("/urls", (req, res) => {

  //get new unique short url key
  let newShortURL = generateShortUrl();

  //add urls to database with userID tag
  urlDatabase[newShortURL] = {
    'longURL': req.body['longURL'],
    'userID': req.session['user']['id']
  }

  //redirect to that short urls main page
  res.redirect(`urls/${newShortURL}`);

})


  //posted after requesting to delete a specific url from database
app.post("/urls/:id/delete", (req, res) => {

  //get unique short url key from params
  let shortURL = req.params.id;

  //check if the url belongs to the current user - do their IDs match?
  if(req.session['user']['id'] === urlDatabase[shortURL]['userID']){

    //if url belongs to current user, remove from the database
    delete urlDatabase[shortURL];
  }

  //redirect to urls listing page
  res.redirect('/urls');
})


  //posted after user requests to update the long url associated with a given short url
app.post("/urls/:id", (req, res) => {

  let shortURL = req.params.id;

  //require correct login.... match to userID
  if(req.session['user']['id'] === urlDatabase[shortURL]['userID']){

    //idetify short url id, and the desired new paired long url
    let updatedLongURL = req.body['updatedLongURL'];

    //if longUrl is present, update the database value
    if(updatedLongURL){

      urlDatabase[shortURL]['longURL'] = updatedLongURL;
    }
  }

  //redirect to urls listing page
  res.redirect('/urls');
})


  //posted after login attempt
app.post("/login", (req, res) => {

  //get email and password for login attempt
  let attemptedEmail = req.body['email'];
  let attemptedPassword = req.body['password'];

  //if both email and password are present, proceed to check if valid
  if(attemptedEmail && attemptedPassword){

    //check if any user in the database matches given email and password
    let foundUser = findUser(attemptedEmail, attemptedPassword);

    //if the user was located in the database
    if(foundUser){
      //store data in cookies
      req.session.user = foundUser;

      //redirect to their urls listing page
      res.redirect('/urls');

    } else {

      //if email and/or password had no match, render error page
      make404(res); //email and/or password were not found :(
    }
  }
})


  //posted after logout request
app.post("/logout", (req, res) => {

  //clear session cookies
  req.session = null;

  //redirect to login page
  res.redirect('/login');
})


  //posted after registration attempt
app.post('/register', (req,res) => {

  //get requested email and password from registration request
  let email = req.body['email'];
  let password = req.body['password'];


  //check that both an email and a password were given
  if(!(email && password)){
    //if not, render and error
    make404(res);// , "need both a username and password!");
  } else if(!(password.length > 7)){
    //put restrictions on password, must be at least 8 chars
    make404(res);
  } else {
    //check if email has already been used (is it already stored in users?)
    let checkIfUnique = isNotUniqueEmail(email)

    if (checkIfUnique) {

      //if not unique, render an error
      make404(res); //, "Email already registered!");

    } else {

      //if both a unique email and a password are present, generate new random ID for user
      let newID = generateRandomUserId();
      let password = bcrypt.hashSync(req.body['password'], 10);

      //store user information in user database
      users[newID] = {
        'id': newID,
        'email': email,
        'password': password
      }

      //store user information in session cookies
      req.session.user = users[newID]

      //redirect to their urls listing page
      res.redirect('/urls');
    }
  }

})




app.listen(PORT, () => {
  console.log(`Example app listenign on port ${PORT}!`);
});

