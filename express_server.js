const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
// const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require("cookie-session");
app.set("view engine", "ejs")
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());

function generateRandomString() {
  let randNum = Math.floor((Math.random() * 1000 + 10000));
  let randString = 'a' + randNum;
  return randString;
}

// for git
//again for git

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID2" }
};


// const users = {
//   "user1": {
//     username: "duckyTheDuck"
//   },
//   "user2": {
//     username: "quackyTheQuack"
//   }
// };

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
}

const { emailLooker } = require("./helpers.js")

// function (email, database) {
//   for (let id in database) {
//     if (database[id].email === email) {
//       return id
//     }
//   }
// }


app.post("/login", (req, res) => {
  console.log("login", req.body);
  console.log("users", users);
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  console.log("password", userPassword)
  for (let id in users) {
    console.log("usersEmail", users[id]["email"])
    console.log("usersPassword", users[id]["password"])
    console.log("compareSync", bcrypt.compareSync(userPassword, users[id]['password']));
    if (users[id]['email'] === userEmail && bcrypt.compareSync(userPassword, users[id]['password'])) {
      // res.cookie("userID", emailLooker(userEmail));
      req.session.userID = emailLooker(userEmail);
      res.redirect("/urls");
      return;
    }
  }
  res.status(403);
  res.send("Invalid username or password.")
});


app.get("/u/:shortURL", (req, res) => {
  console.log("longURL", urlDatabase[req.params.shortURL].longURL)
  console.log("reqParamsshort", req.params.shortURL);
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

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

app.get("/urls", (req, res) => {
  // console.log("req.cookies", req.cookies);
  const cookie = req.session.userID
  if (cookie) {
    const templateVars = {
      urls: userURLs(cookie),
      username: req.session["username"],
      // req.cookies["username"],
      user: users[req.session["userID"]]
      // req.cookies["userID"]]
    };
    console.log(templateVars);
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.session["username"],
    // username: req.cookies["username"],
    user: users[req.session["userID"]]
    // user: users[req.cookies["userID"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["userID"];
  // req.cookies["userID"];
  if (!userID) {
    res.redirect('/login');
    return;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session["userID"]]
    // [req.cookies["userID"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.session["username"],
    user: users[req.session["userID"]]
    // username: req.cookies["username"],
    // user: users[req.cookies["userID"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req, res) => {
  const templateVars = {
    username: null,
    user: null
  }
  res.render("urls_registration", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: null,
    user: null
  }
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    username: null,
    user: null
  }
  res.render("url_login", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL// const longURL = ...
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('https://http.cat/404');
  }
});

app.post("/register", (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10)
  const randomID = generateRandomString();
  // console.log("hashpassword", bcrypt.hashSync(password, 10))
  if (email === '' || password === '') {
    res.status(400);
    res.send("Invalid input! Please try again")
    return;
  } else if (emailLooker(email)) {
    res.status(400);
    res.send("email already exists")
  } else {
    users[randomID] = { id: randomID, email, password: hashedPassword }
    console.log("users", users);
    // res.cookie("userID", randomID);
    req.session.userID = randomID;
    // res.cookie("username", email);
    req.session.username = email;
    res.redirect(`urls`);
  }
})

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  const userID = req.session["userID"];
  // req.cookies["userID"];
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID, };
  console.log('the urlDatabase has been updated to now be: \n', urlDatabase);
  res.redirect(`/urls`);         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const userID = req.session["userID"];
  // req.cookies["userID"];
  if (userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = { longURL: req.body.longURL, userID, };
  }
  console.log('the urlDatabase has been updated to now be: \n', urlDatabase);
  res.redirect(`/urls`);         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["userID"];
  // req.cookies["userID"];
  if (userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  const username = req.body.username;
  res.clearCookie("username");
  res.clearCookie("userID");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});