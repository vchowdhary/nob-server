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
const NotificationNode = require('./NotificationNode');

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
 
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyBfxlrjGDrdWc8Ycg9WA9dAi5bJcEuO1_g', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};
 
var geocoder = NodeGeocoder(options);

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
            MatchNotification: { value: models.Notification }
        });
    }

    async sendAcceptedNotification(matchID, to, from, isRequest)
    {
        if(isRequest)
        {
            console.log('Sending accepted notification');
            const message = await models.sequelize.transaction(async(transaction) => {
                return await models.Match.findOne({where: {id: matchID}})
                .then(async (match) => {
                    console.log(match);
                    match.update({provider_id: from});
                    console.log(match.requester_id);

                    let messages = [];

                    const token = await models.FirebaseToken.findOne({where: {id: match.requester_id}});
                    console.log("Token found");
                    console.log(token);
                        if (!Expo.isExpoPushToken(token.token)) {
                            console.error(`Push token ${token.token} is not a valid Expo push token`);
                        }
                        console.log("Pushing messages");

                        const location = await geocoder.reverse({lat: match.location.lat, lon: match.location.lng})
                            .then(function(res) {
                                console.log(res[0].formattedAddress);
                                return res[0].formattedAddress;
                            })
                            .catch(function(err) {
                                console.log(err);
                            });

                            console.log(location);

                            var dropOffLocation = null;
                            if(match.service_type === 'delivery')
                            {
                                dropOffLocation = await geocoder.reverse({lat: match.dropOffLocation.lat, lon: match.dropOffLocation.lng})
                                .then(function(res) {
                                    console.log(res[0].formattedAddress);
                                    return res[0].formattedAddress;
                                })
                                .catch(function(err) {
                                    console.log(err);
                                });

                                console.log(dropOffLocation);
                            }
                        
                        var message = match.provider_id + ' has confirmed your request for: ' + match.service_type + ': ' + match.subject_1 + ', ' + match.subject_2 + ', ' + match.subject_3 + '\nDetails:' + match.details + '\nLocation:' + location;
                        message += (match.service_type === "tutoring") ? "" : "\nDrop-off Location: " + dropOffLocation;

                        let data = {
                            from_id: match.provider_id, 
                            to_id: match.requester_id, 
                            title: "Request Confirmed", 
                            message: message,
                            time: 0
                        }

                        messages.push({
                            to: token.token,
                            sound: 'default',
                            title: 'Request Confirmed',
                            data: data,
                            priority: 'high',
                            channelId: 'channel1',
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
                    });
                });
        }
        else
        {
            console.log('Sending accepted notification');
            const message = await models.sequelize.transaction(async(transaction) => {
                return await models.Match.findOne({where: {id: matchID}})
                .then(async (match) => {
                    console.log(match);
                    match.update({requester_id: from});
                    console.log(match.provider_id);

                    let messages = [];

                    const token = await models.FirebaseToken.findOne({where: {id: match.provider_id}});
                    console.log("Token found");
                    console.log(token);
                        if (!Expo.isExpoPushToken(token.token)) {
                            console.error(`Push token ${token.token} is not a valid Expo push token`);
                        }

                        const location = await geocoder.reverse({lat: match.location.lat, lon: match.location.lng})
                            .then(function(res) {
                                console.log(res[0].formattedAddress);
                                return res[0].formattedAddress;
                            })
                            .catch(function(err) {
                                console.log(err);
                            });

                            console.log(location);

                            var dropOffLocation = null;
                            console.log(reqobj.type);
                            if(match.service_type === 'delivery')
                            {
                                dropOffLocation = await geocoder.reverse({lat: match.dropOffLocation.lat, lon: match.dropOffLocation.lng})
                                .then(function(res) {
                                    console.log(res[0].formattedAddress);
                                    return res[0].formattedAddress;
                                })
                                .catch(function(err) {
                                    console.log(err);
                                });

                                console.log(dropOffLocation);
                            }

                        var message = match.requester_id + ' has confirmed your offer for: ' + match.service_type + ': ' + match.subject_1 + ', ' + match.subject_2 + ', ' + match.subject_3 + '\nDetails:' + match.details + '\nLocation:' +location;
                        message += (match.service_type === "tutoring") ? "" : "\nDrop-off Location: " + dropOffLocation;

                        let data = {
                            from_id: match.requester_id, 
                            to_id: match.provider_id, 
                            title: "Offer Confirmed", 
                            message: message,
                            time: 0
                        }

                        console.log("Pushing messages");
                        messages.push({
                            to: token.token,
                            sound: 'default',
                            title: 'Offer Confirmed',
                            data: data,
                            priority: 'high',
                            channelId: 'channel1',
                        });

                        console.log(messages);

                        let chunks = expo.chunkPushNotifications(messages);
                        let tickets = [];
                        (async () => {
                        // Send the chunks to the Expo pus
                                for (let chunk of chunks) {
                                    try {
                                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                                    console.log(ticketChunk);
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
                    });
                });
        }
    }
    
    async update(id, status)
    {
        console.log('Attempting update');
        try{
            return await models.sequelize.transaction(async(transaction) => {
                const result = await models.Notification.findOne({where: {id: id}})
                .then(async (notification) => {
                   console.log(notification);
                   notification.update({status: status});

                   if(status === "rejected" || status === "later")
                   {
                       NotificationNode.delete(notification.id);
                   }
                   else if(status === "accepted"){
                       return this.sendAcceptedNotification(notification.matchID, notification.from, notification.to, notification.title === "Match Request");
                   }
                   else if(status === "missed")
                   {
                    if(notification.next === null)
                    {
                        await models.NotificationList.findOne({where: {id: notification.listID}})
                        .then(async function (notiflist){
                            console.log(notiflist);
                            console.log("Missed");
                            if(notiflist.attempts === 3)
                            {
                                await NotificationNode.sendRejectedNotification(notification);
                            }
                            else{
                                notiflist.update({attempts: notiflist.attempts + 1});
                                await NotificationNode.sendAll(notiflist);
                            }
                        });
                    }
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
                    /*const {
                        id, 
                        status,
                        match_name, 
                        match_id,
                        attempt,
                        request,
                        isRequest
                    } = req.body;*/
                    const {
                        id,
                        status
                    } = req.body;

                    console.log(req.body);


                    console.log(status);

                    //const result = await this.update(id, status, match_id, attempt, request, isRequest);
                    
                    const result = await this.update(id, status);
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
                    
                    if(req.query.type === 'getStatus')
                    {
                        const notification = await this.getNotification(
                            id
                        );
                        console.log('Found status successfully');
    
                        console.log('Fetched this notif...');
                        console.log(notification);
    
                        res.status(201);
                        res.json(notification.status).end();

                    }
                    else {
                        const notification = await this.getNotification(
                            id
                        );
                        console.log('Found successfully');
    
                        console.log('Fetched this...');
                        //console.log(location);
    
                        res.status(201);
                        res.json(notification).end();
                    }
                    
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