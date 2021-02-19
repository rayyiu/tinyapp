//helper functions for express_server
//returns an id if the id in a database is identical to an email inputted.
const emailLooker = function (email, database) {
    for (let id in database) {
        if (database[id].email === email) {
            return id
        }
    }
}

//generates a random string
const generateRandomString = function () {
    let randNum = Math.floor((Math.random() * 1000 + 10000));
    let randString = 'a' + randNum;
    return randString;
}

module.exports = { emailLooker, generateRandomString };