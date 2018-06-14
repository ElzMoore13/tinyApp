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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
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

const make404 = function(res){
  res.status(400).render('404.ejs')
}



//GET method routes

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/urls', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    userId: req.cookies['userId'],
    urls: urlDatabase
  };
  console.log(templateVars['username'])
  res.render('urls_index.ejs', templateVars)
})

app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    userId: req.cookies['userId'],
  }
  res.render('urls_new.ejs', templateVars);
})

app.get('/urls/:id', (req, res) => {
  const shortUrlKey = req.params.id
  let templateVars = {
    username: req.cookies["username"],
    userId: req.cookies['userId'],
    shortURL: shortUrlKey,
    longURL: urlDatabase[shortUrlKey]
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
    username: req.cookies["username"],
  }
  res.render('register.ejs', templateVars);
})




//POST method routes

app.post("/urls", (req, res) => {
  let newShortURL = generateShortUrl();
  urlDatabase[newShortURL] = req.body['longURL'];
  res.redirect(`urls/${newShortURL}`);

})

app.post("/urls/:id/delete", (req, res) => {
  let siteID = req.params.id;
  delete urlDatabase[siteID];
  res.redirect('/urls');
})

app.post("/urls/:id", (req, res) => {
  let updatedLongURL = req.body['updatedLongURL'];
  let shortURL = req.params.id;
  if(updatedLongURL){
    urlDatabase[shortURL] = updatedLongURL;
  }
  res.redirect(`/urls/${shortURL}`);
})

app.post("/login", (req, res) => {
  let requestedUsername = req.body['username']
  console.log(requestedUsername)
  if(requestedUsername){
    res.cookie('username', req.body['username']);
  }
  res.redirect('/urls');
})

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.clearCookie('userId');
  res.redirect('/urls');
})

app.post('/register', (req,res) => {
  let email = req.body['email'];
  let password = req.body['password'];
  let checkIfUnique = isNotUniqueEmail(email)
  if(!(email && password)){
    make404(res, "need both a username and password!");
  } else if (checkIfUnique) {
    make404(res, "Emaiil already registered!");
  } else {
    let newID = generateRandomUserId();
    users[newID] = {
      'id': newID,
      'email': email,
      'password': password
    }
    console.log(users);
    res.cookie('userId', newID);
    res.redirect('/urls');
  }

})




app.listen(PORT, () => {
  console.log(`Example app listenign on port ${PORT}!`);
});

