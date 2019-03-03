const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

router.post("/signup", (req, res, next) => {
    User.find({ email: req.body.email })
    .exec()
    .then(user => {
        if (user && user.length > 0) {
            return res.status(409).json({
                message: "Email exists"
            });
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
            if(err) {
                return res.status(500).json({
                    error: err
                });
            } else {
                const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    email: req.body.email,
                    password: hash
                });
                user
                .save()
                .then(result => {
                    res.status(201).json({
                        message: "User created"
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    });
                });
            }
        });
        }
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
});


router.get("/signin", (req, res, next) => {
    User.find({ email: req.body.email })
    .exec()
    .then(users => {
        if (users.length < 1) {
            return res.status(401).json({
                message: "Auth failed"
            });
        }
        bcrypt.compare(req.body.password, users[0].password, (err, result) => {
            if(err) {
                return res.status(401).json({
                message: "Auth failed"
                }); 
            }
            if(result) {
                const token = jwt.sign({
                    email: users[0].email,
                    userId: users[0]._id
                },
                process.env.JWT_KEY,
                {
                    expiresIn: "1h"
                })

                return res.status(200).json({
                    message: "Auth successful",
                    token: token
                });
            }
            res.status(401).json({
                message: "Auth failed"
            }); 
        });
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
});

module.exports = router;