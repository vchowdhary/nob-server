/**
 * Location tracking API tools
 * @module LocationTracking
 */

'use strict';
const Router = require('express-promise-router');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const models = require('../models');

/**
 * Handles location tracking
 * @alias module:TutoringSubjects
 */
class TutoringSubjects {
    /**
     * Creates new LocationController
     * 
     * @param {Sequelize} sequelize - The Sequelize instance
     */
    constructor(sequelize) {

        //Users.belongsTo(Geolocation);
        //Geolocation.hasMany(Users);

        Object.defineProperties(this, /** @lends module:TutoringSubjects# */ {
            /**
             * The Sequelize instance.
             *
             * @private
             * @readonly
             * @type {Sequelize}
             */
            sequelize: { value: sequelize },
            TutoringSubject: { value: models.TutoringSubjects }
        });
    }

    /**
     * Inserts into database
     * @param {string} name - the new subject name
     * @returns {module:TutoringSubjects} Returns created location
     */
    async insertTutoring(name){
        console.log('Attempting insert...');
        try {
            return await models.sequelize.transaction(async(transaction) => {
                await models.TutoringSubject.create({ subject: name });
            });
        } catch (err) {
            console.log('This didnt work');
            console.log(err);
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Error(`Subject "${name}" already exists.`);
            }

            if (err instanceof Sequelize.ValidationError) {
                throw new Error(err.errors.reduce(
                    function(str, error) {
                        return `${str}\n${error.message}`;
                    },
                    'Validation failed:'
                ));
            }
            throw err;
        }
    }

    /**
     * Inserts into database
     * @param {string} name - the new subject name
     * @returns {module:TutoringSubjects} Returns created location
     */
    async insertDelivery(name){
        console.log('Attempting insert...');
        try {
            return await models.sequelize.transaction(async(transaction) => {
                await models.DeliveryCategory.create({ category: name });
            });
        } catch (err) {
            console.log('This didnt work');
            console.log(err);
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Error(`Subject "${name}" already exists.`);
            }

            if (err instanceof Sequelize.ValidationError) {
                throw new Error(err.errors.reduce(
                    function(str, error) {
                        return `${str}\n${error.message}`;
                    },
                    'Validation failed:'
                ));
            }
            throw err;
        }
    }



    /**
     * Gets locaton of given user
     */
    async getAllTutoring()
    {
        try
        {
            return await models.sequelize.transaction(async(transaction) => {
                return models.TutoringSubject.findAll();
            });

        } catch (err){
            console.log('This didnt work');
            console.log(err);

            if (err instanceof Sequelize.ValidationError) {
                throw new Error(err.errors.reduce(
                    function(str, error) {
                        return `${str}\n${error.message}`;
                    },
                    'Validation failed:'
                ));
            }
            throw err;
        }
    }

    /**
     * Gets locaton of given user
     */
    async getAllDelivery()
    {
        try
        {
            return await models.sequelize.transaction(async(transaction) => {
                return models.DeliveryCategory.findAll();
            });

        } catch (err){
            console.log('This didnt work');
            console.log(err);

            if (err instanceof Sequelize.ValidationError) {
                throw new Error(err.errors.reduce(
                    function(str, error) {
                        return `${str}\n${error.message}`;
                    },
                    'Validation failed:'
                ));
            }
            throw err;
        }
    }

    /**
     * Creates a new router for the locations.
     *
     * @returns {express~Router} The router.
     */
    router() {
        // Router for a single location.
        const subjectRouter = Router();

        // Attempts to create a new location.
        subjectRouter.put(
            '/',
            bodyParser.json(),
            async(req, res) => {
                //const { id } = req;

                try {
                    //console.log('put try');
                    const {
                        name,
                        service
                    } = req.body;
                    //console.log(req.body);

                    if (!name) {
                        throw new Error('Missing request data.');
                    }

                    console.log('Attempting to insert');
                    console.log(name);
                    if(service === 'tutoring')
                    {
                        await this.insertTutoring(
                            name
                        );
                    }
                    else{
                        console.log(service);
                        await this.insertDelivery(name);
                    }
                    console.log('Inserted successfully');

                    const ulocation = req.originalUrl;
                    res.set('Location', ulocation);
                    res.set('Content-Type', 'text/plain')
                        .status(201)
                        .end();

                } catch (err) {
                    // Creation failed; report error.
                    console.log('Error occurred');
                    console.log(err);
                    res.set('Content-Type', 'text/plain')
                        .status(400)
                        .send(err.message)
                        .end();
                }
            }
        );

        // Gets information about the specified location.
        subjectRouter.get(
            '/',
            bodyParser.json(),
            async(req, res) => {
                try {
                    console.log('get try');
                    var result = null;

                    if(req.query.service === 'tutoringSubjects'){
                        console.log('Getting all tutoring');
                        result = await this.getAllTutoring();
                    }
                    else{
                        console.log(req.query.service);
                        console.log('Getting all delivery');
                        result = await this.getAllDelivery();
                    }
                    
                    console.log('Found successfully');

                    res.status(201);
                    res.json(result).end();

                } catch (err) {
                    // Creation failed; report error.
                    console.log('Error occurred');
                    console.log(err);
                    res.set('Content-Type', 'text/plain')
                        .status(400)
                        .send(err.message)
                        .end();
                }
            }
            
        );

        return subjectRouter;
    }

}

Object.freeze(TutoringSubjects);
module.exports = TutoringSubjects;