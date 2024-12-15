const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fName: String,
    lName: String,
    email: String,
    username: String,
    password: String,
    chapter: String
});

const Users = mongoose.model("users", userSchema);
module.exports = Users;