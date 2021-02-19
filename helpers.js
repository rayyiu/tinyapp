const emailLooker = function (email, database) {
    for (let id in database) {
        if (database[id].email === email) {
            return id
        }
    }
}

module.exports = { emailLooker };