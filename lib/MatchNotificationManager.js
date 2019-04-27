/**
 * Manages notifications
 * @module LocationTracking
 */

'use strict';
const Router = require('express-promise-router');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const models = require('../models');
const { Expo } = require('expo-server-sdk');


const expo = new Expo();

/**
 * Manages notifications
 * @alias module:NotificationManager
 */
class MatchNotificationManager {
    /**
     * Creates new LocationController
     * 
     * @param {Sequelize} sequelize - The Sequelize instance
     */
    constructor(sequelize) {

        Object.defineProperties(this, /** @lends module:MatchNotificationManager# */ {
            /**
             * The Sequelize instance.
             *
             * @private
             * @readonly
             * @type {Sequelize}
             */
            sequelize: { value: sequelize },
            MatchNotification: { value: models.MatchNotification }
        });
    }


    async sendNotification(to, match_id, matches, attempt, match_notif_id, req, maxMatch)
    {
        console.log(to);
        console.log("Matches:");
        console.log(matches);
        console.log(match_id);
        const message = await models.sequelize.transaction(async(transaction) => {
            return await models.Match.findOne({where: {id: match_id}})
            .then(async (match) => {
                console.log(match_id);
                console.log(match);
                console.log(matches === null);
                if(attempt < maxMatch && matches !== undefined && !(matches.length === 0)){
                    if(match.provider_id === '')
                    {
                        let messages = [];

                        const token = await models.FirebaseToken.findOne({where: {id: to}});
                        if (!Expo.isExpoPushToken(token.token)) {
                            console.error(`Push token ${token.token} is not a valid Expo push token`);
                        }
                        console.log("Pushing messages");
                        messages.push({
                            to: token.token,
                            sound: 'default',
                            title: 'Match Request',
                            data: {attempt: attempt + 1, match_notif_id: match_notif_id, req: req, from_id: match.requester_id, to_id: to, type: 'match_request', message: match.requester_id + ' is requesting your help with ' + match.service_type + ': ' + match.subject_1 + ', ' + match.subject_2 + ', ' + match.subject_3 + '\nDetails:' + match.details + '\nLocation:' + match.location.lat + ', ' + match.location.lng}
                        });

                        let chunks = expo.chunkPushNotifications(messages);
                        let tickets = [];
                        (async () => {
                        // Send the chunks to the Expo pus
                                for (let chunk of chunks) {
                                    try {
                                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                                    tickets.push(...ticketChunk);
                                    } catch (error) {
                                    console.error(error);
                                    }
                                }
                        })();
                        let receiptIds = [];
                        for (let ticket of tickets) {
                        // NOTE: Not all tickets have IDs; for example, tickets for notifications
                        // that could not be enqueued will have error information and no receipt ID.
                            if (ticket.id) {
                                    receiptIds.push(ticket.id);
                                }
                            }

                            let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
                            (async () => {
                            // Like sending notifications, there are different strategies you could use
                            // to retrieve batches of receipts from the Expo service.
                            for (let chunk of receiptIdChunks) {
                                console.log('receipts');
                                let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                                console.log(receipts);

                                // The receipts specify whether Apple or Google successfully received the
                                // notification and information about an error, if one occurred.
                                for (let receipt of receipts) {
                                    if (receipt.status === 'error') {
                                        console.error(`There was an error sending a notification: ${receipt.message}`);
                                        if (receipt.details && receipt.details.error) {
                                            // The error codes are listed in the Expo documentation:
                                            // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                                            // You must handle the errors appropriately.
                                            console.error(`The error code is ${receipt.details.error}`);
                                            }
                                        }
                                    }
                                };
                            })();
                            return null;
                    }
                }
                else{
                    console.log('else');
                    let messages = [];
        
                    const token = await models.FirebaseToken.findOne({where: {id: match.requester_id}});
                    if (!Expo.isExpoPushToken(token.token)) {
                        console.error(`Push token ${token.token} is not a valid Expo push token`);
                    }
                    console.log("Pushing messages");
                    messages.push({
                        to: token.token,
                        sound: 'default',
                        title: 'Try Again',
                        data: {from_id: match.requester_id, to_id: to, type: 'match_failed', message: 'No one is available to help you right now. Please try again later.'}
                    });
        
                    let chunks = expo.chunkPushNotifications(messages);
                    let tickets = [];
                    (async () => {
                    // Send the chunks to the Expo pus
                            for (let chunk of chunks) {
                                try {
                                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                                tickets.push(...ticketChunk);
                                } catch (error) {
                                console.error(error);
                                }
                            }
                    })();
                    let receiptIds = [];
                    for (let ticket of tickets) {
                    // NOTE: Not all tickets have IDs; for example, tickets for notifications
                    // that could not be enqueued will have error information and no receipt ID.
                        if (ticket.id) {
                            receiptIds.push(ticket.id);
                        }
                    }
        
                    let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
                    (async () => {
                    // Like sending notifications, there are different strategies you could use
                    // to retrieve batches of receipts from the Expo service.
                    for (let chunk of receiptIdChunks) {
                        console.log('receipts');
                        let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                        console.log(receipts);
        
                        // The receipts specify whether Apple or Google successfully received the
                        // notification and information about an error, if one occurred.
                        for (let receipt of receipts) {
                            if (receipt.status === 'error') {
                                console.error(`There was an error sending a notification: ${receipt.message}`);
                                if (receipt.details && receipt.details.error) {
                                    // The error codes are listed in the Expo documentation:
                                    // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                                    // You must handle the errors appropriately.
                                    console.error(`The error code is ${receipt.details.error}`);
                                    }
                                }
                            }
                        };
                    })();
                }
            });
        });
    }
    

    /**
     * Inserts into database
     * @returns {module:MatchNotification} Returns updated notification
     */
    async update(id, status, match_name, attempt, req,){
        console.log('Attempting insert...');
        try {
            return await models.sequelize.transaction(async(transaction) => {
                const result = await models.MatchNotification.findOne({where: {id: id}})
                .then((notification) => {
                   console.log(notification);
                   console.log(notification.matches.split('|'));
                   let matches = notification.matches.split('|');
                   let i = matches.indexOf(match_name);
                  
                   console.log(status);
                   console.log(status === 'rejected');
                   if(status === 'rejected' || status === 'later'){
                       matches.splice(i, 1);
                       notification.update({matches: matches.join('|'), status: notification.statuses+JSON.stringify(match_name, status), attempt: attempt + 1});
                       console.log('Sending to...');
                       console.log(matches[i]);
                       return this.sendNotification(matches[i], notification.matchID, matches, attempt, id, req, notification.maxAttempt);
                   }
                   else if(status === 'missed'){
                        notification.update({matches: matches, status: notification.statuses+JSON.stringify(match_name, status), attempt: attempt + 1});
                        console.log('Sending to...');
                        console.log(matches[(i+1)%(Math.min(5, matches.length))]);
                        return this.sendNotification(matches[(i+1)%(Math.min(5, matches.length))], notification.matchID, matches, attempt, id, req, notification.maxAttempt);
                   }
                   else{
                       notification.update({matches: matches, status: notification.statuses+JSON.stringify(match_name, status)});
                       return "done";
                   }
                });
                console.log(result);
                return result;
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
                        id, 
                        status,
                        match_name, 
                        match_id,
                        attempt,
                        request
                    } = req.body;
                    console.log(req.body);

                    console.log(status);

                    const result = await this.update(id, status, match_id, attempt, request);
                    console.log(result);

                    const ulocation = req.originalUrl;
                    res.set('Location', ulocation);
                    res.json(result)
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

Object.freeze(MatchNotificationManager);
module.exports = MatchNotificationManager;