require("dotenv/config");
const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const { url } = require("inspector");
var urlencodedParser = bodyParser.json({ extended: false });
const { requireAuth } = require("../middleware/authMiddleware");

const User = require("../models/user.js");



// get all users

router.get("/allUsers", async (req, res) => {
  const users = await User.find();
  res.send(users);
});
// get single user for edit 

router.get("/getUser/:id", async (req, res) => {
    try {
        const user = await User.findById({ _id: req.params.id });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err)
    }
})

// update profile

router.put("/updateUser/:id", async (req, res) => {
    try {
        const updateUser = await User.findByIdAndUpdate({ _id: req.params.id }, {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            cellPhone: req.body.cellPhone,
            cnicNumber: req.body.cnicNumber,
            city: req.body.city,
            country: req.body.country
        })
        res.status(200).json(updateUser);
    } catch (err) {
        res.status(500).json(err)
    }
})

module.exports = router;