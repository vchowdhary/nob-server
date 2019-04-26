/**
 * Manages notifications
 * @module LocationTracking
 */

'use strict';
const Router = require('express-promise-router');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const models = require('../models');

/**
 * Manages notifications
 * @alias module:NotificationManager
 */
class NotificationManager {
    /**
     * Creates new LocationController
     * 
     * @param {Sequelize} sequelize - The Sequelize instance
     */
    constructor(sequelize) {

        //Users.belongsTo(Geolocation);
        //Geolocation.hasMany(Users);

        Object.defineProperties(this, /** @lends module:NotificationManager# */ {
            /**
             * The Sequelize instance.
             *
             * @private
             * @readonly
             * @type {Sequelize}
             */
            sequelize: { value: sequelize },
            Notification: { value: models.Notification }
        });
    }

    /**
     * Inserts into database
     * @param {string} latitude - latitude to be inserted
     * @param {string} longitude - same as above
     * @param {string} userID - the associated user id
     * @returns {module:Geolocation} Returns created location
     */
    async insert(to, from, message, status){
        console.log('Attempting insert...');
        console.log(userID);
        try {
            return await models.sequelize.transaction(async(transaction) => {
                const notification = await models.Notification.findOrCreate({ to: to, from: from, message: message, status: status })
                .spread(function(notif, created) {
                    if (created)
                    {
                        return notif;
                    }
                    else
                    {
                        notif.update({to: to, from: from, message: message, status: status});
                        return notif;
                    }
                });
                return notification;
            });
        } catch (err) {
            console.log('This didnt work');
            console.log(err);
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Error(`Location of user with id"${userID}" already exists.`);
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
     * Gets given notification w/id id 
     * @param {userID} id  - id
     */
    async getNotification(id)
    {
        try
        {
            return await models.sequelize.transaction(async(transaction) => {
                const location = await models.Notification.findOne({ where: { id: id } });
                return location;
            });

        } catch (err){
            console.log('This didnt work');
            console.log(err);
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Error(`Location of user with id"${userID}" already exists.`);
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
                    console.log('put try');
                    const {
                        to,
                        from,
                        message, 
                        status
                    } = req.body;
                    //console.log(req.body);

                    if (!to || !from) {
                        throw new Error('Missing request data.');
                    }

                    console.log('Attempting to insert');
                    
                    await this.insert(
                        to,
                        from,
                        message,
                        status
                    );
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

                    /*const {
                        latitude,
                        longitude,
                        userID
                    } = req.body;*/

                    var id = req.query.id;

                    console.log(req.query.id);
                    //console.log(latitude);
                    //console.log(longitude);

                    if (!id) {
                        throw new Error('Missing request data.');
                    }

                    const notification = await this.getNotification(
                        id
                    );
                    console.log('Found successfully');

                    console.log('Fetched this...');
                    //console.log(location);

                    res.status(201);
                    res.json(notification).end();
                    //res.set('Location', ulocation);
                    /*res.set('Content-Type', 'application/json')
                        .status(201)
                        .end();*/

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

Object.freeze(NotificationManager);
module.exports = NotificationManager;