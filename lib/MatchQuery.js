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
const NotificationNode = require('./NotificationNode');


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
                    console.log(req.query);
                    var reqobj = JSON.parse(req.query.request);
                    var matchID = req.query.matchID;
                    console.log(reqobj);
                    console.log(matchID);
                    await match.run(limit, reqobj, true, req.query.requester_id).then(async function(v)
                    {
                        match.matchIDs = v;
                        var arr = match.matchIDs.join('|');
                        const notif = await models.MatchNotification.create({matches: arr, matchID: req.query.matchID, 
                            message: reqobj.requester_id + ' is requesting your help with ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + reqobj.location.lat + ', ' + reqobj.location.lng, 
                            statuses: "", maxAttempt: 3});
                        console.log("Created notif");
                        console.log(notif);

                        let messages = [];

                        const token = await models.FirebaseToken.findOne({where: {id: match.matchIDs[0]}});
                        if (!Expo.isExpoPushToken(token.token)) {
                            console.error(`Push token ${token.token} is not a valid Expo push token`);
                        }
                        console.log("Pushing messages");
                        messages.push({
                            to: token.token,
                            sound: 'default',
                            title: 'Match Request',
                            data: {isRequest: true, attempt: 1, match_notif_id: notif.id, req: reqobj, from_id: req.query.requester_id, to_id: match.matchIDs[0], type: 'match_request', message: req.query.requester_id + ' is requesting your help with ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + reqobj.location.lat + ', ' + reqobj.location.lng}
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

                        var notifs = new Array(v.length);
                        for(let i = 0; i < v.length; i ++)
                        {
                            const message = (req.query.offer.service_type === 'tutoring') ? 
                                            req.query.requester_id + ' is requesting your help with ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + reqobj.location.lat + ', ' + reqobj.location.lng :
                                            req.query.requester_id + ' is requesting your help with ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + reqobj.location.lat + ', ' + reqobj.location.lng + '\nDrop-off Location:' + reqobj.location.lat + ', ' + reqobj.location.lng;
                            const data = {
                                to: v[i],
                                from: req.query.requester_id,
                                message: message,
                                title: 'Match Request',
                                matchID: matchID,
                            }
                            notifs[i] = NotificationNode.createNotification(data);
                            console.log(notifs[i]);
                        }

                        let time = 0;
                        for(let i = 0; i < notifs.length; i++)
                        {
                            //Setting previous ids
                            if(i > 0){
                                await NotificationNode.setPrev(notifs[i], notifs[i-1]);
                            }
                            else{
                                await NotificationNode.setPrev(notifs[i], notifs[notifs.length - 1].id());
                            }

                            //Setting next ids
                            if(i < notifs.length - 1)
                            {
                                await NotificationNode.setNext(notifs[i], notifs[i+1].id());
                            }
                            else
                            {
                                await NotificationNode.setNext(notifs[i], notifs[0].id());
                            }

                            await NotificationNode.send(notifs[i], time);
                            time += 5000;
                        }

                        res.status(200)
                           .end(); 
                    });
                }
                else if('offer' in req.query){
                    console.log('Attempting matching');
                    var reqobj = JSON.parse(req.query.offer);
                    var matchIDo = req.query.matchID;
                    console.log(reqobj);
                    console.log(matchIDo);
                    
                    await match.run(limit, reqobj, false, req.query.provider_id).then(async function(v)
                    {
                        match.matchIDs = v;
                        console.log(v);

                        var notifs = new Array(v.length);
                        let time = 0;
                        for(let i = 0; i < v.length; i ++)
                        {
                            const message = (req.query.offer.type === 'tutoring') ? 
                                            req.query.provider_id + ' is offering ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + reqobj.location.lat + ', ' + reqobj.location.lng :
                                            req.query.provider_id + ' is offering ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + reqobj.location.lat + ', ' + reqobj.location.lng + '\nDrop-off Location:' + reqobj.location.lat + ', ' + reqobj.location.lng;
                            const data = {
                                to: v[i],
                                from: req.query.provider_id,
                                message: message,
                                title: 'Match Offer',
                                matchID: matchIDo 
                            }
                            notifs[i] = await NotificationNode.createNotification(data);
                            console.log(notifs[i]);
                        }

                        var time2 = 0;
                        for(let i = 0; i < notifs.length; i++)
                        {
                            //Setting previous ids
                            if(i > 0){
                                console.log("Setting prev");
                                console.log(notifs[i]);
                                console.log(notifs[i - 1]);
                                await NotificationNode.setPrev(notifs[i], notifs[i-1]);
                            }
                            else{
                                console.log("Setting prev");
                                console.log(notifs[i]);
                                console.log(notifs[notifs.length - 1]);
                                await NotificationNode.setPrev(notifs[i], notifs[notifs.length - 1]);
                            }

                            //Setting next ids
                            if(i < notifs.length - 1)
                            {
                                console.log("Setting next");
                                console.log(notifs[i]);
                                console.log(notifs[i+1]);
                                await NotificationNode.setNext(notifs[i], notifs[i+1]);
                            }
                            else
                            {
                                console.log("Setting next");
                                console.log(notifs[i]);
                                console.log(notifs[0]);
                                await NotificationNode.setNext(notifs[i], notifs[0]);
                            }

                            console.log("Sending");
                            console.log(notifs[i]);
                            await NotificationNode.send(notifs[i], time2);
                            time2 += 5000;
                        }

                        res.status(200)
                           .end(); 
                    });
                }
            }
        );

        return router;
    }
}

Object.freeze(MatchQuery);

module.exports = MatchQuery;

