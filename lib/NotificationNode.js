const Router = require('express-promise-router');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const models = require('../models');
const { Expo } = require('expo-server-sdk');


const expo = new Expo();


class NotificationNode{
    static async createNotification(data) {
            return await models.Notification.create({
                to: data.to,
                from: data.from,
                message: data.message,
                title: data.title,
                status: null,
                prev: null,
                next: null,
                attempts: 1,
                matchID: data.matchID,
            }).then((notif) =>
            {
                return notif.id;
            });
    }

    static async getNotification(id){
        return await models.Notification.findOne({where: {id: id}});
    }

    static async setNext(currID, id) {
        await models.Notification.findOne({where: {id: currID}})
        .then(function(notif){
            notif.update({next: id});
        });
    }

    static async setPrev(currID, id) {
        await models.Notification.findOne({where: {id: currID}})
        .then(function(notif){
            notif.update({prev: id});
        });
    }

    static async delete(id){
        console.log('Deleting node...');
        await models.Notification.findOne({where: {id: id}})
        .then(async function(notif){
            console.log(notif);
            const prev = await models.Notification.findOne({where: {id: notif.prev}});
            const next = await models.Notification.findOne({where: {id: notif.next}});
            console.log("Old prev");
            console.log(prev);
            console.log("Old next");
            console.log(next);
            prev.update({next: next.id});
            next.update({prev: prev.id});
            console.log(prev);
            console.log(next);
        });
    }

    static async send(id, time) {
        await models.Notification.findOne({where: {id: id}})
        .then(async function(notif)
        {
            let messages = [];

            const token = await models.FirebaseToken.findOne({where: {id: notif.to}});
            if (!Expo.isExpoPushToken(token.token)) {
                console.error(`Push token ${token.token} is not a valid Expo push token`);
            }
            console.log("Pushing messages");
            messages.push({
                to: token.token,
                sound: 'default',
                title: notif.title,
                data: {isRequest: false, 
                    attempt: notif.attempt, 
                    message: notif.message, 
                    next: notif.next, 
                    prev: notif.prev, 
                    from: notif.from, 
                    to: notif.to,
                    id: notif.id, 
                    time: time,
                    title: notif.title,
                },
                priority: 'high',
                channelId: 'channel1'
            });
            console.log(messages);

            console.log('chunks');
            let chunks = expo.chunkPushNotifications(messages);
            console.log(chunks);
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


            console.log(tickets);

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
        });
    }

}

Object.freeze(NotificationNode);

module.exports = NotificationNode;