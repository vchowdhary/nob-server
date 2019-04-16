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
 * @alias module:FirebaseTokens
 */
class FirebaseTokens {
    /**
     * Creates new LocationController
     * 
     * @param {Sequelize} sequelize - The Sequelize instance
     */
    constructor(sequelize) {

        //Users.belongsTo(Geolocation);
        //Geolocation.hasMany(Users);

        Object.defineProperties(this, /** @lends module:FirebaseTokens# */ {
            /**
             * The Sequelize instance.
             *
             * @private
             * @readonly
             * @type {Sequelize}
             */
            sequelize: { value: sequelize },
            FirebaseToken: { value: models.FirebaseToken }
        });
    }

    /**
     * Inserts into database
     * @param {string} id - the new id
     * @param {string} token - new token
     * @returns {module:FirebaseToken} Returns created location
     */
    async insert(id, token){
        console.log('Attempting insert...');
        try {
            return await models.sequelize.transaction(async() => {
                await models.FirebaseToken.findOne({ where: { id: id } })
                    .then(function(obj) {
                        if(obj) { // update
                            return obj.update({ token });
                        }
                        return models.FirebaseToken.create({ id: id, token: token });
                    });
            });
        } catch (err) {
            console.log('This didnt work');
            console.log(err);
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Error(`User "${id}"'s token already exists.`);
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
     * Gets token of given user
     * @param {string} id = user id
     */
    async get(id)
    {
        try
        {
            return await models.sequelize.transaction(async() => {
                return models.FirebaseToken.find({ where: { id: id } });
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
        const router = Router();

        // Attempts to create a new location.
        router.put(
            '/',
            bodyParser.json(),
            async(req, res) => {
                //const { id } = req;

                try {
                    console.log('put try token');
                    console.log(req.body);
                    const {
                        id,
                        token
                    } = req.body;
                    
                    if(!id || !token){
                        throw new Error('Missing request data');
                    }

                    console.log('Attempting to insert');
                    console.log(id);
                    this.insert(id, token);
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
        router.get(
            '/',
            bodyParser.json(),
            async(req, res) => {
                try {
                    console.log('get try');
                    var result = null;

                    result = await this.get(req.query.id);
                    
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

        return router;
    }

}

Object.freeze(FirebaseTokens);
module.exports = FirebaseTokens;