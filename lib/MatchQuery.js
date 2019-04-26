/* eslint-disable complexity */
/* eslint-disable guard-for-in */
/* eslint-disable no-loop-func */
/* eslint-disable max-statements */
/**
 * Match querying.
 *
 * @module MatchQuery
 */

'use strict';

const Router = require('express-promise-router');
const levenshtein = require('js-levenshtein');

const isAuthenticated = require('./isAuthenticated');
const models = require('../models');
const Op = models.Sequelize.Op;
const { Expo } = require('expo-server-sdk')


const expo = new Expo();


/**
 * Calculates the match score for an employer and employee.
 *
 * A higher score is better.
 *
 * @param {module:Users#Profile} employer - The employer profile.
 * @param {module:Users#Profile} employee - The employee profile.
 * @returns {number} The score.
 */
function matchScore(employer, employee) {
    // TODO broken
    return [
        'weekendActivity',
        'favoriteFood',
        'likeToWatch',
        'pittsburghFavorite'
    ].reduce(function(score, key) {
        if (!(key in employer) || !(key in employee)) {
            return score;
        }

        const a = employer[key];
        const b = employee[key];
        const diff = 1 - (levenshtein(a, b) / Math.max(a.length, b.length));

        return score + diff;
    }, 0);
}

/**
 * Represents a match query.
 *
 * @alias module:MatchQuery
 */
class MatchQuery {
    /**
     * Creates a new query.
     *
     * @param {module:Users} users - The user map.
     * @param {module:User#Profile} user - The query's user profile.
     */
    constructor(users) {
        
        ['calculateDistance',
            'deg2rad'
        ].forEach(key => {
            this[key] = this[key].bind(this);
        });

        Object.defineProperties(this, /** @lends module:MatchQuery# */ {
            /**
             * The user map.
             *
             * @readonly
             * @type {module:Users}
             */
            users: { value: users },

            /**
             * The matched user IDs, or `null` if not yet matched.
             *
             * @readonly
             * @type {string[]?}
             */
            userIDs: { value: null, writable: true }
        });
    }

    // eslint-disable-next-line max-statements
    /**
     * Runs the query.
     *
     * @param {number} [limit] - Maximum number of employees to match.
     * @param {JSON} req - details of the request
     * @param {bool} isRequest - true if request, false otws. 
     * @returns {module:MatchQuery} Resolves with the query on success, or
     * rejects with an error.
     */
    async run(limit, req, isRequest, id) {
        console.log('run');
        console.log(id);
        //console.log(req);
        //console.log(String(req.type));
        var histories = [];
        var dataArr = [];
        var potential_matches = null;

        if(req.type === 'tutoring'){
            if(isRequest){
                var key = 'tutoring.' + [req.subject_1];
                potential_matches = await models.User.findAll({
                    attributes: ['id'],
                    include: [
                        { model: models.Profile, where: { [key]: { [Op.ne]: null } } ,
                            attributes: ['id', 'tutoring'] } 
                    ]
                });
        
                //console.log(potential_matches);
        
                dataArr = new Array(potential_matches.length);
    
                for (let i = 0; i < potential_matches.length; i++)
                {
                    console.log(potential_matches[i]);
                    if(potential_matches[i].id !== id)
                    {
                        await models.Match.findAll(
                            { attributes: [
                                ['provider_id', 'id'],
                                'details',
                                'time',
                                'location', 
                                ['provider_score','score'],
                                'dropOffLocation'
                            ],
                            where: {
                                service_type: req.type,
                                subject_1: req.subject_1,
                                subject_2: req.subject_2,
                                subject_3: req.subject_3,
                                provider_id: potential_matches[i].id
                            }
                            }).then(function(matches){
                            console.log(matches);
                            for(var j = 0; j < matches.length; j++){
                                histories.push(matches[j]);
                            }
                        }).catch(function(err){
                            return err;
                        });
                    
                        //console.log(histories[i]);
    
                        await potential_matches[i].getGeolocations().then(function(location){
                            const locationlatest = location.pop();
                            console.log('req');
                            //console.log(req);
                            var lat2 = req.location.lat;
                            var lon2 = req.location.lng;
                            var lat1 = locationlatest.latitude;
                            var lon1 = locationlatest.longitude;
    
                            console.log(lat1, lon1, lat2, lon2);
    
                            var R = 6371; // Radius of the earth in km
                            var dLat = (lat2 - lat1) * (Math.PI / 180);  // deg2rad below
                            var dLon = (lon2 - lon1) * (Math.PI / 180); 
                            var a = 
                                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos((lat1) * (Math.PI / 180)) * Math.cos((lat2) * (Math.PI / 180)) * 
                                Math.sin(dLon / 2) * Math.sin(dLon / 2)
                                ; 
                            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
                            var d = R * c; // Distance in km
                            dataArr[i] = { time: (1000 * d / 60) };
                            console.log(dataArr[i]);
                        });
    
                        
                        await potential_matches[i].getProfile().then(function(profile){
                            console.log('getting profile');
                            //console.log(profile);
                            var key = isRequest ? 'timetotutor' : 'timetogettutored';
                            dataArr[i] = { id: profile.id, 
                                subject_1: profile[[req.type]][[req.subject_1]],
                                subject_2: profile[[req.type]][[req.subject_2]],
                                subject_3: profile[[req.type]][[req.subject_3]],
                                time: profile['tutoring'][[key]],
                                time_request: dataArr[i].time };
                        });
                    }
                }
            }
            else{
                var key = 'tutoringNeeds.' + [req.subject_1];
                potential_matches = await models.User.findAll({
                    attributes: ['id'],
                    include: [
                        { model: models.Profile, where: { [key]: { [Op.ne]: null } } ,
                            attributes: ['id', 'tutoringNeeds'] } 
                    ]
                });
        
                //console.log(potential_matches);
        
                dataArr = new Array(potential_matches.length);
    
                for (let i = 0; i < potential_matches.length; i++)
                {
                    console.log(potential_matches[i]);
                    if(potential_matches[i].id !== id)
                    {
                        await models.Match.findAll(
                            { attributes: [
                                ['requester_id', 'id'],
                                'details',
                                'time',
                                'location', 
                                ['requester_score','score'],
                                'dropOffLocation'
                            ],
                            where: {
                                service_type: 'tutoring',
                                subject_1: req.subject_1,
                                subject_2: req.subject_2,
                                subject_3: req.subject_3,
                                requester_id: potential_matches[i].id
                            }
                            }).then(function(matches){
                            console.log(matches);
                            for(var j = 0; j < matches.length; j++){
                                histories.push(matches[j]);
                            }
                        }).catch(function(err){
                            return err;
                        });
                    
                        //console.log(histories[i]);
    
                        await potential_matches[i].getGeolocations().then(function(location){
                            const locationlatest = location.pop();
                            console.log('req');
                            // console.log(req);
                            var lat2 = req.location.lat;
                            var lon2 = req.location.lng;
                            var lat1 = locationlatest.latitude;
                            var lon1 = locationlatest.longitude;
    
                            console.log(lat1, lon1, lat2, lon2);
    
                            var R = 6371; // Radius of the earth in km
                            var dLat = (lat2 - lat1) * (Math.PI / 180);  // deg2rad below
                            var dLon = (lon2 - lon1) * (Math.PI / 180); 
                            var a = 
                                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos((lat1) * (Math.PI / 180)) * Math.cos((lat2) * (Math.PI / 180)) * 
                                Math.sin(dLon / 2) * Math.sin(dLon / 2)
                                ; 
                            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
                            var d = R * c; // Distance in km
                            dataArr[i] = { time: (1000 * d / 60) };
                            console.log(dataArr[i]);
                        });
    
                        
                        await potential_matches[i].getProfile().then(function(profile){
                            console.log('getting profile');
                            //console.log(profile);
                            //console.log(profile['tutoringNeeds']);
                            dataArr[i] = { id: profile.id, 
                                subject_1: profile['tutoringNeeds'][[req.subject_1]],
                                subject_2: profile['tutoringNeeds'][[req.subject_2]],
                                subject_3: profile['tutoringNeeds'][[req.subject_3]],
                                time: profile['tutoringNeeds']['timetogettutored'],
                                time_request: dataArr[i].time };
                            console.log(dataArr[i]);
                        });
                    }
                }
            }
            console.log(histories);
            console.log('data');
            console.log(dataArr);
            console.log(dataArr.length === 0);
            
            if (limit === void 0) {
                limit = potential_matches.length;
            }

            
            if(dataArr.length === 0) return null;
            
            console.log('running python script');
            var spawn = require('child_process').spawn;
            var py    = await spawn('python', ['/Users/vanshikachowdhary/Desktop/nob-server/tools/get_matches.py']),
                data = [req, dataArr, histories],
                dataString = '';
            
            py.stdin.write(JSON.stringify(data));
            py.stdin.end();
            py.stdout.on('data', function(data){
                dataString += data.toString();
            });
            return new Promise(function(resolve, reject){
                py.stdout.on('end', function(){
                    console.log(dataString);
                    if (dataString == null) return null;
                    var result = JSON.parse(dataString);
                    console.log(result);
                    //console.log(Object.keys(result.id_x).length);
                    if(result.length === 1){ return result; }
        
                    limit = Math.min(limit, Object.keys(result).length);
                    //console.log(limit);
                    var employeeID2s = new Array(limit);
                    for(var i = 0; i < limit; i++)
                    {
                        employeeID2s[i] = result['' + i];
                    }
                    //console.log(employeeIDs);
                    //this.employeeIDs = employeeIDs;
                    resolve(employeeID2s);
                });
            }, 5000);
        }
        if(isRequest){
            var key = 'delivery.' + req.subject_1;
            potential_matches = await models.User.findAll({
                attributes: ['id'],
                include: [
                    { model: models.Profile, where: { [key]: { [Op.ne]: null } }, 
                        attributes: ['id', req.type] }
                ]
            });
            
            //console.log(potential_matches);
            
            dataArr = new Array(potential_matches.length);
        
            for (let i = 0; i < potential_matches.length; i++)
            {
                console.log(potential_matches[i]);
                if(potential_matches[i].id !== this.user)
                {
                    await models.Match.findAll(
                        { attributes: [
                            ['provider_id', 'id'],
                            'details',
                            'time',
                            'location', 
                            ['provider_score','score'],
                            'dropOffLocation'
                        ],
                        where: {
                            service_type: req.type,
                            subject_1: req.subject_1,
                            subject_2: req.subject_2,
                            subject_3: req.subject_3,
                            provider_id: potential_matches[i].id
                        }
                        }).then(function(matches){
                        console.log(matches);
                        for(var j = 0; j < matches.length; j++){
                            histories.push(matches[j]);
                        }
                    }).catch(function(err){
                        return err;
                    });
                        
                    //console.log(histories[i]);
        
                    await potential_matches[i].getGeolocations().then(function(location){
                        const locationlatest = location.pop();
                        console.log('req');
                        //console.log(req);
                        var lat2 = req.location.lat;
                        var lon2 = req.location.lng;
                        var lat1 = locationlatest.latitude;
                        var lon1 = locationlatest.longitude;
        
                        console.log(lat1, lon1, lat2, lon2);
        
                        var R = 6371; // Radius of the earth in km
                        var dLat = (lat2 - lat1) * (Math.PI / 180);  // deg2rad below
                        var dLon = (lon2 - lon1) * (Math.PI / 180); 
                        var a = 
                                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos((lat1) * (Math.PI / 180)) * Math.cos((lat2) * (Math.PI / 180)) * 
                                    Math.sin(dLon / 2) * Math.sin(dLon / 2)
                                    ; 
                        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
                        var d = R * c; // Distance in km
                        dataArr[i] = { time: (1000 * d / 60) };
                        //console.log(dataArr[i]);
                    });
        
                            
                    await potential_matches[i].getProfile().then(function(profile){
                        console.log('getting profile');
                        //console.log(profile);
                        dataArr[i] = { id: profile.id, 
                            subject_1: profile[[req.type]][[req.subject_1]],
                            time: profile['delivery']['timetopickup'],
                            time2: profile['delivery']['timetodeliver'],
                            time_request: dataArr[i].time,
                            time2_request: req.timetodeliver };
                    });
                }       
            }
        }
        else{
            var key = 'deliveryNeeds.' + req.subject_1;
            potential_matches = await models.User.findAll({
                attributes: ['id'],
                include: [
                    { model: models.Profile, where: { [key]: { [Op.ne]: null } }, 
                        attributes: ['id', req.type] }
                ]
            });
            
            //console.log(potential_matches);
            
            dataArr = new Array(potential_matches.length);
        
            for (let i = 0; i < potential_matches.length; i++)
            {
                console.log(potential_matches[i]);
                if(potential_matches[i].id !== id)
                {
                    await models.Match.findAll(
                        { attributes: [
                            ['requester_id', 'id'],
                            'details',
                            'time',
                            'location', 
                            ['requester_score','score'],
                            'dropOffLocation'
                        ],
                        where: {
                            service_type: req.type,
                            subject_1: req.subject_1,
                            subject_2: req.subject_2,
                            subject_3: req.subject_3,
                            provider_id: potential_matches[i].id
                        }
                        }).then(function(matches){
                        console.log(matches);
                        for(var j = 0; j < matches.length; j++){
                            histories.push(matches[j]);
                        }
                    }).catch(function(err){
                        return err;
                    });
                        
                    //console.log(histories[i]);
        
                    await potential_matches[i].getGeolocations().then(function(location){
                        const locationlatest = location.pop();
                        console.log('req');
                        console.log(req);
                        var lat2 = req.location.lat;
                        var lon2 = req.location.lng;
                        var lat1 = locationlatest.latitude;
                        var lon1 = locationlatest.longitude;
        
                        console.log(lat1, lon1, lat2, lon2);
        
                        var R = 6371; // Radius of the earth in km
                        var dLat = (lat2 - lat1) * (Math.PI / 180);  // deg2rad below
                        var dLon = (lon2 - lon1) * (Math.PI / 180); 
                        var a = 
                                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos((lat1) * (Math.PI / 180)) * Math.cos((lat2) * (Math.PI / 180)) * 
                                    Math.sin(dLon / 2) * Math.sin(dLon / 2)
                                    ; 
                        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
                        var d = R * c; // Distance in km
                        dataArr[i] = { time: (1000 * d / 60) };
                        console.log(dataArr[i]);
                    });
        
                            
                    await potential_matches[i].getProfile().then(function(profile){
                        console.log('getting profile');
                        console.log(profile);
                        dataArr[i] = { id: profile.id, 
                            subject_1: profile[[req.type]][[req.subject_1]],
                            time: profile['deliveryNeeds']['timetopickup'],
                            time2: 1,
                            time_request: dataArr[i].time,
                            time2_request: 1 };
                    });
                } 
            }
        }
        console.log(histories);
        console.log(dataArr);
            
        if (limit === void 0) {
            limit = potential_matches.length;
        }

        if(dataArr.length === 0) return null;
            
        console.log('running python script');
        console.log('delivery');
        var spawn = require('child_process').spawn;
        var py    = await spawn('python', ['/Users/vanshikachowdhary/Desktop/nob-server/tools/get_matches_delivery.py']),
            data = [req, dataArr, histories],
            dataString = '';
            
        py.stdin.write(JSON.stringify(data));
        py.stdin.end();
        py.stdout.on('data', function(data){
            dataString += data.toString();
            console.log(dataString);
        });
        return new Promise(function(resolve, reject){
            py.stdout.on('end', function(){
                console.log(dataString);
                if (dataString === '') return null;
                var result = JSON.parse(dataString);
                console.log(result);
                //console.log(Object.keys(result.id_x).length);
                if(result.length === 1){ return result; }
        
                limit = Math.min(limit, Object.keys(result).length);
                //console.log(limit);
                var employeeID2s = new Array(limit);
                for(var i = 0; i < limit; i++)
                {
                    employeeID2s[i] = result[''+i];
                }
                //console.log(employeeIDs);
                //this.employeeIDs = employeeIDs;
                resolve(employeeID2s);
            });
        }, 5000);
    }

    /**
     * Calculates distance between two points. 
     * @param {float} lat1 - the first latitude
     * @param {float} lon1 - the first lng
     * @param {float} lat2 - the second latitude
     * @param {float} lon2 - the second longitude
     * @returns {float} - approx walking time
     */
    calculateDistance(lat1, lon1, lat2, lon2){
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = this.deg2rad(lon2 - lon1); 
        var a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
          ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
        var d = R * c; // Distance in km
        return d * 1000 / (60);
    }
    
    /**
     * Converts degrees to radians. 
     * @param {float} deg - degree
     * @returns {float} - converted to radian
     */
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }


    async _sendRequests(userID, matchIDs, request)
    {
        for(var i = 0; i < 3; i++)
        {
            console.log("Attempts");
            console.log(i);
            if(matchIDs === null)
            {
                console.log("Try again later");
                return {message: "try later"};
            }
            else{
                //Try the first user; will try 5 users at most
                var newMatchIds = matchIDs;
                for (var j = 0; j < Math.min(matchIDs.length, 5); j++)
                {
                    console.log("Checking matches");
                    //Send a notification to this user, remember the notification ID
                    //If user accepts, then send notification current user that it worked and break and return done
                    //If missed, continue.
                    //If rejected, remove this index
                    let messages = [];
                    console.log(matchIDs[j]);
                    let id = 0;
                    await models.Notification.findOrCreate({where: {to: matchIDs[j], from: userID, message: 'pending match request', status: null}})
                    .spread(function(notif, created){
                        console.log(created);
                        if( created ){
                            console.log(notif.id);
                            id = notif.id;
                            return notif.id;
                        }
                        else{
                            if(notif.status === 'accepted'){
                                return {id: notif.id, match: matchIDS[j]};
                                
                            }
                            else if(notif.status === 'rejected'){
                                newMatchIds.splice(j, 1);
                            }
                            console.log(notif.dataValues);
                            id = notif.id;
                            return notif.id;
                        }
                    });
                    console.log('id');
                    console.log(id);
                    const token = await models.FirebaseToken.findOne({where: {id: matchIDs[j]}});
                    if (!Expo.isExpoPushToken(token.token)) {
                        console.error(`Push token ${token.token} is not a valid Expo push token`);
                        newMatchIds.splice(j, 1);
                        continue;
                    }
                    console.log("Pushing messages");
                    messages.push({
                        to: token.token,
                        sound: 'default',
                        data: {notif_id: id, req: request, from_id: userID, to_id: token.id, type: 'match_request'}
                    });

                    let chunks = expo.chunkPushNotifications(messages);
                    let tickets = [];
                    (async () => {
                    // Send the chunks to the Expo push notification service. There are
                    // different strategies you could use. A simple one is to send one chunk at a
                    // time, which nicely spreads the load out over time:
                            for (let chunk of chunks) {
                                try {
                                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                                tickets.push(...ticketChunk);
                                // NOTE: If a ticket contains an error code in ticket.details.error, you
                                // must handle it appropriately. The error codes are listed in the Expo
                                // documentation:
                                // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                                } catch (error) {
                                console.error(error);
                                }
                            }
                    })();
                    // Later, after the Expo push notification service has delivered the
                    // notifications to Apple or Google (usually quickly, but allow the the service
                    // up to 30 minutes when under load), a "receipt" for each notification is
                    // created. The receipts will be available for at least a day; stale receipts
                    // are deleted.
                    //
                    // The ID of each receipt is sent back in the response "ticket" for each
                    // notification. In summary, sending a notification produces a ticket, which
                    // contains a receipt ID you later use to get the receipt.
                    //
                    // The receipts may contain error codes to which you must respond. In
                    // particular, Apple or Google may block apps that continue to send
                    // notifications to devices that have blocked notifications or have uninstalled
                    // your app. Expo does not control this policy and sends back the feedback from
                    // Apple and Google so you can handle it appropriately.
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
                        try {
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
                            const notification = await models.Notifications.findOne({where: {id: id}});
                            if (notification.status == 'accepted') {
                                return {id: id,  match: matchIDS[j]};
                            }
                            else if(notification.status == 'rejected') {
                                newMatchIDS.splice(j, 1);
                            }
                        } catch (error) {
                        console.error(error);
                        }
                    }})();
                }
                matchIDs = newMatchIds;
            }
        }
    }

    /**
     * Creates a new router for match querying.
     *
     * @param {module:Users} users - The user map.
     * @returns {express~Router} The router.
     */
    static router(users) {
        const router = Router();

        router.get(
            '/',

            async function(req, res) {
                let limit;
                console.log('Getting matches API');
                console.log(req);
                const match = new MatchQuery(users);
                if ('request' in req.query) {
                    console.log('Attempting matching');
                    var reqobj = JSON.parse(req.query.request);
                    var matchID = req.query.matchID;
                    console.log(reqobj);
                    console.log(matchID);
                    await match.run(limit, reqobj, true, req.query.requester_id).then(function(v)
                    {
                        match.matchIDs = v;
                        match._sendRequests(req.query.requester_id, match.matchIDs, reqobj).then((result) => {
                            console.log('Completed matching');
                            console.log(result);
                            res.json(result).end(); 
                        })
                    });
                }
                else if('offer' in req.query){
                    console.log('Attempting matching');
                    var offerobj = JSON.parse(req.query.offer);
                    var matchIDo = req.query.matchID;
                    console.log(offerobj);
                    console.log(matchIDo);
                    
                    await match.run(limit, offerobj, false, req.query.provider_id).then(function(v)
                    {
                        match.matchIDs = v;
                    });
                    console.log(match.matchIDs);
                    res.json(match.matchIDs).end();
                }

                if ('limit' in req.query) {
                    limit = Number.parseInt(req.query.limit, 10);
                    if (Number.isNaN(limit)) {
                        res.set('Content-Type', 'text/plain')
                            .status(400)
                            .end();
                    }
                }
            }
        );

        return router;
    }
}

Object.freeze(MatchQuery);

module.exports = MatchQuery;

