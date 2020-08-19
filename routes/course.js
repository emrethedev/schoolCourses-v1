'use strict';

const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator');

// Pulling a reference to the user from the database.
const User = require('../models').User;

// Pulling a reference to the course from the database.
const Course = require('../models').Course;

// Constructs a new router instance. 
const router = express.Router();

// User Authentication Middleware Setup
// https://teamtreehouse.com/library/rest-api-authentication-with-express
const authenticateUser = async (req, res, next) => {
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
    };
  }  
  
// COURSE ROUTES

/**
 * HTTP METHOD, Route, HTTP Status Code
 * GET /api/courses 200 
 * Returns a list of courses 
 * (including the user that owns each course)
 */
router.get('/courses', asyncHandler(async(req, res) => {
    const courses = await Course.findAll({
        attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId'],
        include: [{
            attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
            model: User,

        }],
    });
    res.status(200)
        .json(courses);
}));

/**
 * HTTP METHOD, Route, HTTP Status Code
 * GET /api/courses/:id 200
 * Returns a the course 
 * (including the user that owns the course) for the provided course ID
 */
router.get('/courses/:id', asyncHandler(async(req, res, next) => {
    const course = await Course.findByPk(req.params.id, {
        attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId'],
        include: [{
            attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
            model: User,
        }],
    });

    if (course) {
        res.status(200)
            .json(course);
      } else {
        res.status(404)
            .json({
          message: 'Oops! The course could not be located.'
        });
      }
}));

/** 
 * HTTP METHOD, Route, HTTP Status Code
 * POST /api/courses 201
 * Creates a course, 
 * sets the Location header to the URI for the course, 
 * returns no content
 */
router.post('/courses', [
    check('title')
        .exists({ checkNull: true })
        .withMessage('"title" needs a value!'),
    check('description')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('"description" needs a value'),
], authenticateUser, asyncHandler(async (req, res, next) => {
    // Tries getting validation result from Req Obj.
    const errors = validationResult(req);
    try {
        // In the event that errors are found.
        if (!errors.isEmpty()) {
            // // Uses the array map() method to get a list of error messages.
            const errorMessages = errors.array()
                .map(error => error.msg);
            return res.status(400)
                .json({ errors: errorMessages });
        }
        let course;
        course = await Course.create(req.body);
        const id = course.id;
        res.location(`/courses/${id}`)
            .status(201)
            .end();
    } catch (error) {
        throw error;
    };
}));

/**
 * HTTP METHOD, Route, HTTP Status Code
 * PUT /api/courses/:id 204
 * Updates a course and returns no content
 */
router.put('/courses/:id', [
    check('title')
        .exists({ checkNull: true })
        .withMessage('"title" needs a value!'),
    check('description')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('"description" needs a value!'),
], authenticateUser, asyncHandler(async(req, res, next) => {
    const errors = validationResult(req);
    try {
        if(!errors.isEmpty()) {
            const errorMessages = errors.array()
                .map(error => error.msg);
            return res.status(400)
                .json({ errors: errorMessages });
        } 
        let course;
        const user = req.currentUser;
        course = await Course.findByPk(req.params.id);

        // If course exists....
        if (course) {
            if (course.userId === user.id) {
                await course.update(req.body);
                res.status(204)
                    .end();
            } else {
                return res.status(403)
                    .json({ 
                        message: 'Please make sure you are trying to edit your own course.'
                    });
            }
        } else { 
            res.status(404)
            .json({ 
                message: 'Please double check that this course exists in the database.'
            });
        }
    } catch (error) {
        throw error;
    };
}));

/**
 * HTTP METHOD, Route, HTTP Status Code
 * DELETE /api/courses/:id 204
 * Deletes a course and returns no content
 */
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
    try {
        let course;
        const user = req.currentUser;
        course = await Course.findByPk(req.params.id);

        if (course) {
            if (course.userId === user.id) {
                await course.destroy();
                res.status(204)
                    .end();
            } else {
                return res.status(403)
                    .json({ message: 'Please make sure you are trying to modify your own course.' });
            }
        } else {
            res.status(404)
                .json({ message: 'Please double check that this course exists in the database.' });
        }
    } catch (error) {
        throw error;
    }
}));

// Makes course.js available in other pages.
module.exports = router;
