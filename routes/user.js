'use strict';

const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator');

// Pulling a reference to the user from the database.
const User = require('../models').User;

// // Keeps track of user records as they are created.
// const users = [];

// Constructs a new router instance. 
const router = express.Router();

// User Authentication Middleware Setup
// https://teamtreehouse.com/library/rest-api-authentication-with-express
const authenticateUser = async(req, res, next) => {
    // Authentication Message
    let message = null;

    // Parses the user's credentials from the auth header.
    const credentials = auth(req);

    // When/if user credentials exist and are available.
    if (credentials) {
        // Tries to retrieve the user from the database
        const user = await User.findOne({
            where: { emailAddress: credentials.name },
        });
        // If/when user is found and retrieved from DB
        if (user) {
            // Deploys bcryptjs to compare user password
            const authenticated = bcryptjs
                .compareSync(credentials.pass, user.password);
            
            // In the event that passwords are the same
            if (authenticated) {
                console.info(`Authentication is successful for user: ${user.emailAddress}`);
                req.currentUser = user;
            } else {
                message = `User ${user.emailAddress} is not authenticated.`;
            } 
        } else {
            message = `User ${credentials.name} is not found...`;
        };
    } else {
        message = `AUTH Header not found.`;
    };

    // In the event that auth does not succeed.
    if (message) {
        console.warn(message);

        // Passes a 400-level error response.
        res.status(401)
            .json({ 
                message: 'Failed or no authentication, please authenticate first.'
            });
    } else {
        // If all is well, then move on with/to the next step:
        next();
    }
  };

// https://teamtreehouse.com/library/validation-and-handling-errors-2
/* Handler function to wrap each route. */
function asyncHandler(cb){
    return async(req, res, next) => {
      try {
          await cb(req, res, next)
      } catch(error){
          res.status(500)
            .send(error);
      }
    }
  }  
  

// USER ROUTES

/**
 * HTTP METHOD, Route, HTTP Status Code
 * GET /api/users 200
 * Returns the currently authenticated user
 */
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;

    // Sends a response in the JSON format (hence Postman)
    res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
    })
    .status(200);
}));


/**
 * HTTP METHOD, Route, HTTP Status Code
 * POST /api/users 201 
 * Creates a user, sets the Location header to "/"
 * Returns no content
 */
router.post('/users', [
    check('firstName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('"firstName" needs a value!'),
    check('lastName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('"lastName" needs a value!'),
    check('emailAddress')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('"emailAddress" needs a value!')
        .isEmail()
        .withMessage('"emailAddress" must be a VALID value!'),
    check('password')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('"password" needs a value!'),
], asyncHandler(async (req, res) => {
    // Tries to obtain result from Req Obj.
    const errors = validationResult(req);
    try {
        // In the event that errors are found.
        if (!errors.isEmpty()) {
            // Uses the array map() method to get a list of error messages.
            const errorMessages = errors.array()
                .map(error => error.msg);
            return res.status(400)
                .json({ errors: errorMessages });
        };

        // Obtains the user's request body.
        const user = await req.body;

        // Hashes the password.
        user.password = bcryptjs.hashSync(user.password);

        // Creates the user to the array of users.
        await User.create(user);

        // Sets the current status tp 201 (Created) & ends response.
        return res.location('/')
            .status(201)
            .end();
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(422)
                .json({ message: 'Hmm, this email is already taken!'});
        } else {
            // Throws hands in the air, as well as an error
            // ¯_(ツ)_/¯
            throw error;
        }
    }
}));

// Makes user.js available in other pages.
module.exports = router;
