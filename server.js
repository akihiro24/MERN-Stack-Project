const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Users = require('./models/users');

const port = 3019;
const app = express();

app.listen(port, () => {
    console.log("Server Started");
});

mongoose.connect('mongodb://127.0.0.1:27017/EventLinkRegistration');
const db = mongoose.connection;
db.once('open', () => console.log("MongoDB Connection Successful"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'register-revised.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login-revised.html'));
});

app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '..', 'profile.html'));
});

app.get('/api/user-data', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }
    res.json(req.session.user);
});

app.post('/api/update-profile', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    const { username, fName, lName, email, chapter } = req.body;

    try {
        await Users.findByIdAndUpdate(req.session.user.id, { username, fName, lName, email, chapter });
        req.session.user = { ...req.session.user, username, fName, lName, email, chapter }; // Update session
        res.status(200).send("Profile updated successfully");
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).send("Internal server error");
    }
});

app.post('/post', async (req, res) => {
    const { fName, lName, email, username, password, confirmpassword, chapter } = req.body;

    if (password !== confirmpassword) {
        return res.status(400).send("Passwords do not match");
    }

    try {
        const existingUser = await Users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send("Username or email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new Users({ fName, lName, email, username, password: hashedPassword, chapter });
        await user.save();
        console.log("User registered:", user);

        res.redirect('/login');
    } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).send("Internal server error");
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Users.findOne({ username });
        if (!user) {
            return res.status(404).send("User not found");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send("Incorrect password");
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            fName: user.fName,
            lName: user.lName,
            email: user.email,
            chapter: user.chapter
        };

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});
