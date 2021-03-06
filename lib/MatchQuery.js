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

const config = require('../config.json');
console.log(config.data);

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
                            if(location !== null)
			    {
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
			     }
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
	    console.log('running child process');
            var spawn = require('child_process').spawn;
	    console.log('running python');
            var py    = await spawn('python3', ['/home/vanshika/nob-server/tools/get_matches.py']),
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
		    console.log('dataString:');
                    console.log(dataString);
                    if (dataString == '') return null;
		    console.log('result:');
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
                    console.log(employeeID2s);
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
                        console.log(location);
			if(location != null && location !== [] && location !== undefined && location.length !== 0){
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
			}
                    });
        
                    if(dataArr[i] !== undefined && dataArr[i] !== null){        
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
        console.log(config.data);
        var spawn = require('child_process').spawn;
        var py    = await spawn('python3', [config.data + '/tools/get_matches_delivery.py']),
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
                console.log('data');
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
                        console.log(req.query.requester_id);
			match.matchIDs = v;
                        if(v !== null)
                        {
                            const location = await geocoder.reverse({lat: reqobj.location.lat, lon: reqobj.location.lng})
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
                            if(reqobj.type === 'delivery')
                            {
                                dropOffLocation = await geocoder.reverse({lat: reqobj.dropofflocation.lat, lon: reqobj.dropofflocation.lng})
                                .then(function(res) {
                                    console.log(res[0].formattedAddress);
                                    return res[0].formattedAddress;
                                })
                                .catch(function(err) {
                                    console.log(err);
                                });

                                console.log(dropOffLocation);
                            }

                            const message = (reqobj.type === 'tutoring') ? 
                            req.query.requester_id + ' is requesting ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + location :
                            req.query.requester_id + ' is requesting ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + location + '\nDrop-off Location:' + dropOffLocation;

                            var notifs = new Array(v.length);
                            let time = 0;
                            for(let i = 0; i < v.length; i ++)
                            {

                                const data = {
                                    to: v[i],
                                    from: req.query.requester_id,
                                    message: message,
                                    title: 'Match Request',
                                    matchID: matchID 
                                }
                                notifs[i] = await NotificationNode.createNotification(data);
                                console.log(notifs[i]);
                            }

                            const id = await models.NotificationList.create({first: notifs[0], last: notifs[notifs.length - 1], attempts: 0});

                            var time2 = 0;
                            for(let i = 0; i < notifs.length; i++)
                            {

                                console.log("Set list ID");
                                await NotificationNode.setListID(notifs[i], id.id);

                                //Setting previous ids
                                if(i > 0){
                                    console.log("Setting prev");
                                    console.log(notifs[i]);
                                    console.log(notifs[i - 1]);
                                    await NotificationNode.setPrev(notifs[i], notifs[i-1]);
                                }

                                //Setting next ids
                                if(i < notifs.length - 1)
                                {
                                    console.log("Setting next");
                                    console.log(notifs[i]);
                                    console.log(notifs[i+1]);
                                    await NotificationNode.setNext(notifs[i], notifs[i+1]);
                                }
                                
                                console.log("Sending");
                                console.log(notifs[i]);
                                await NotificationNode.send(notifs[i], time2);
                                time2 += 6000;
                            }
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

                        if(v !== null)
                        {
                            const location = await geocoder.reverse({lat: reqobj.location.lat, lon: reqobj.location.lng})
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
                            if(reqobj.type === 'delivery')
                            {
                                dropOffLocation = await geocoder.reverse({lat: reqobj.dropofflocation.lat, lon: reqobj.dropofflocation.lng})
                                .then(function(res) {
                                    console.log(res[0].formattedAddress);
                                    return res[0].formattedAddress;
                                })
                                .catch(function(err) {
                                    console.log(err);
                                });

                                console.log(dropOffLocation);
                            }

                            var notifs = new Array(v.length);
                            let time = 0;
                            for(let i = 0; i < v.length; i ++)
                            {
                                const message = (req.query.offer.type === 'tutoring') ? 
                                                req.query.provider_id + ' is offering ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + location :
                                                req.query.provider_id + ' is offering ' + reqobj.type + ': ' + reqobj.subject_1 + ', ' + reqobj.subject_2 + ', ' + reqobj.subject_3 + '\nDetails:' + reqobj.details + '\nLocation:' + location + '\nDrop-off Location:' + dropOffLocation;
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

                            const id = await models.NotificationList.create({first: notifs[0], last: notifs[notifs.length - 1], attempts: 0});

                            var time2 = 0;
                            for(let i = 0; i < notifs.length; i++)
                            {

                                console.log("Set list ID");
                                await NotificationNode.setListID(notifs[i], id.id);

                                //Setting previous ids
                                if(i > 0){
                                    console.log("Setting prev");
                                    console.log(notifs[i]);
                                    console.log(notifs[i - 1]);
                                    await NotificationNode.setPrev(notifs[i], notifs[i-1]);
                                }

                                //Setting next ids
                                if(i < notifs.length - 1)
                                {
                                    console.log("Setting next");
                                    console.log(notifs[i]);
                                    console.log(notifs[i+1]);
                                    await NotificationNode.setNext(notifs[i], notifs[i+1]);
                                }
                                
                                console.log("Sending");
                                console.log(notifs[i]);
                                await NotificationNode.send(notifs[i], time2);
                                time2 += 6000;
                            }
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

