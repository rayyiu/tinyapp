//longURLs must include http:// 
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const cookieSession = require("cookie-session");
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}));
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

//sample url database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID2" }
};

//user information is added here. Ids are random.
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "1234"
  }
};

const { emailLooker } = require("./helpers.js");

const { generateRandomString } = require("./helpers.js");

//on login, we check if user email and password match what's in our database (passwords are hashed),
//and redirect the user to their own shorturls page. Otherwise, an error will be produced.
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  for (let id in users) {
    if (users[id]['email'] === userEmail && bcrypt.compareSync(userPassword, users[id]['password'])) {
      req.session.userID = emailLooker(userEmail, users);
      res.redirect("/urls");
      return;
    }
  }
  res.status(403);
  res.send("Invalid username or password.");
});

//this function returns an object that contains URLs by userID
const userURLs = function (userID) {
  let final = {};
  for (let key in urlDatabase) {
    console.log("keys", key);
    console.log("userID", userID);
    if (userID === urlDatabase[key].userID) {
      final[key] = urlDatabase[key];
    }
  }
  console.log("final for userURLS", final);
  return final;
}

//on the get route for /urls, if the user is logged in (through cookies), we render urls_index.
//otherwise, we redirect them to the login page.
app.get("/urls", (req, res) => {
  const cookie = req.session.userID
  if (cookie) {
    const templateVars = {
      urls: userURLs(cookie),
      username: req.session["username"],
      user: users[req.session["userID"]]
    };
    console.log(templateVars);
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

//on the get route for urls/new, we check if the user is logged in--if they are, we render their
//urls on the urls_new template in views. Otherwise, we redirect them to the login page.
app.get("/urls/new", (req, res) => {
  const cookie = req.session.userID
  if (cookie) {
    const templateVars = {
      urls: urlDatabase,
      username: req.session["username"],
      user: users[req.session["userID"]]
    };
    res.render("urls_new", templateVars);
  }
  res.redirect("/login")
});

//on the get route for shortURL, if you are not logged in, you're redirected to the login page. 
//if you are logged in, you will see your own short url page. 
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["userID"];
  if (!userID) {
    res.redirect('/login');
    return;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session["userID"]]
  };
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//we render the registration page at root
app.get("/", (req, res) => {
  const templateVars = {
    username: null,
    user: null
  }
  res.render("urls_registration", templateVars);
});

//when we visit the registration page, we render the html for the page
app.get("/register", (req, res) => {
  const templateVars = {
    username: null,
    user: null
  }
  res.render("urls_registration", templateVars);
});

//likewise for the login page
app.get("/login", (req, res) => {
  const templateVars = {
    username: null,
    user: null
  }
  res.render("url_login", templateVars);
})

//at shortURL, if logged in, redirects to longURL when clicked on shortURL
app.get("/u/:shortURL", (req, res) => {
  console.log("urldatabase", urlDatabase[req.params.shortURL])
  const longURL = urlDatabase[req.params.shortURL]["longURL"]
  console.log("longURL", longURL);
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('https://http.cat/404');
  }
});

//registers a user when they input information that is not blank or already existent within the database.
//hashes the password, passes it to the users object, redirects the user to urls.
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10)
  const randomID = generateRandomString();
  if (email === '' || password === '') {
    res.status(400);
    res.send("Invalid input! Please try again")
    return;
  } else if (emailLooker(email, users)) {
    res.status(400);
    res.send("email already exists")
  } else {
    users[randomID] = { id: randomID, email, password: hashedPassword }
    req.session.userID = randomID;
    req.session.username = email;
    res.redirect(`urls`);
  }
})

//posts a users unique links to urls page.
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  const userID = req.session["userID"];
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID, };
  console.log('the urlDatabase has been updated to now be: \n', urlDatabase);
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  // Log the POST request body to the console
  const userID = req.session["userID"];
  if (userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = { longURL: req.body.longURL, userID, };
  }
  console.log('the urlDatabase has been updated to now be: \n', urlDatabase);
  res.redirect(`/urls`);         // Respond with 'Ok' (we will replace this)
});

//allows the user to delete their own urls
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["userID"];
  if (userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect(`/urls`);
});

//allows the user to logout, clears their cookies.
app.post("/logout", (req, res) => {
  const username = req.body.username;
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});