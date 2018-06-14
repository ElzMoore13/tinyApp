const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static("views"));

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

const users ={
  "322w55ekh7g": {
    id: "322w55ekh7g",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "do1r53g7xat": {
    id: "do1r53g7xat",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

//functions

  // to generate unique shortURLS
function generateShortUrl(){
  const uniqueKey = Math.random().toString(36).replace('0.','').split('').slice(0,6).join('');
  return uniqueKey;
}

  //to generate unique user IDs
function generateRandomUserId(){
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
  console.log(keys);
  let userId = keys.filter(key => users[key]['email'] === email).toString();
  //check if password matches password stored for that user
  if(!userId){
    return null;
  } else if(users[userId]['password'] === password){
    return users[userId];
  }
  else {
    return null;
  }
}




//GET method routes

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/urls', (req, res) => {
  let templateVars = {
    user: req.cookies["user"],
    urls: urlDatabase
  };
  console.log(templateVars['username'])
  res.render('urls_index.ejs', templateVars)
})

app.get('/urls/new', (req, res) => {
  if (req.cookies['user']) {
    let templateVars = {
      user: req.cookies["user"],
    }
    res.render('urls_new.ejs', templateVars);
  } else {
    res.redirect('/login');
  }
})

app.get('/urls/:id', (req, res) => {
  const shortUrlKey = req.params.id
  let templateVars = {
    user: req.cookies["user"],
    shortURL: shortUrlKey,
    longURL: urlDatabase[shortUrlKey]['longURL']
  };
  res.render('urls_show.ejs', templateVars)
})

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})

app.get('/hello', (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL)
})

app.get('/register', (req, res) => {
  let templateVars = {
    user: req.cookies["user"],
  }
  res.render('register.ejs', templateVars);
})

app.get('/login', (req, res) => {
  let templateVars = {
    user: req.cookies['user'],
  }
  res.render('login.ejs', templateVars);
})





//POST method routes

app.post("/urls", (req, res) => {
  let newShortURL = generateShortUrl();
  urlDatabase[newShortURL] = {
    'longURL': req.body['longURL'],
    'userID': req.cookies['id']
  }
  res.redirect(`urls/${newShortURL}`);

})

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;

  if(req.cookies['id'] === urlDatabase[shortURL][userID]){

    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');
})


app.post("/urls/:id", (req, res) => {

  //require correct login.... match to userID
  let shortURL = req.params.id;

  if(req.cookies['user']['id'] === urlDatabase[shortURL]['userID']){

    let updatedLongURL = req.body['updatedLongURL'];

    if(updatedLongURL){
      urlDatabase[shortURL]['longURL'] = updatedLongURL;
    }
  }
  res.redirect('/urls');
})

app.post("/login", (req, res) => {
  let attemptedEmail = req.body['email'];
  let attemptedPassword = req.body['password'];
  if(attemptedEmail && attemptedPassword){
    let foundUser = findUser(attemptedEmail, attemptedPassword);
    if(foundUser){
      res.cookie('user', foundUser);
      res.redirect('/urls');
    } else {
      make404(res); //email and/or password were not found :(
    }
  }
})

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect('/login');
})

app.post('/register', (req,res) => {
  let email = req.body['email'];
  let password = req.body['password'];
  let checkIfUnique = isNotUniqueEmail(email)
  if(!(email && password)){
    make404(res);// , "need both a username and password!");
  } else if (checkIfUnique) {
    make404(res); //, "Email already registered!");
  } else {
    let newID = generateRandomUserId();
    users[newID] = {
      'id': newID,
      'email': email,
      'password': password
    }
    console.log(users);
    res.cookie('user', users[newID]);
    res.redirect('/urls');
  }

})




app.listen(PORT, () => {
  console.log(`Example app listenign on port ${PORT}!`);
});

