/* eslint-disable valid-jsdoc */
/* eslint-disable max-statements */
/**
 * Match history API tools
 * @module MatchHistory
 */

'use strict';
const Router = require('express-promise-router');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const models = require('../models');
const Op = models.Sequelize.Op;



/**
 * Handles prior matches
 * @alias module:MatchHistory
 */
class MatchHistory {
    /**
     * Creates new Match 
     * 
     * @param {Sequelize} sequelize - The Sequelize instance
     */
    constructor(sequelize) {

        //Users.belongsTo(Geolocation);
        //Geolocation.hasMany(Users);

        Object.defineProperties(this, /** @lends module:MatchHistory# */ {
            /**
             * The Sequelize instance.
             *
             * @private
             * @readonly
             * @type {Sequelize}
             */
            sequelize: { value: sequelize },
            Match: { value: models.Match }
        });
    }

    /**
     * Inserts into database
     * @param {string} match_details - details of the match
     * @returns {models.Match} Returns created match
     */
    async insert(match_details, user){
        console.log('Attempting insert...');
        console.log(match_details);
        try {
            //console.log(typeof (this.count));
            return await models.sequelize.transaction(async(transaction) => {
                const match_record = await models.Match.create(match_details);
                return match_record;
            });
        } catch (err) {
            console.log('This didnt work');
            console.log(err);
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Error(`Match of user with id"${user.id}" already exists.`);
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
     * @param {userID} userID  - userID
     */
    async getLocation(userID)
    {
        try
        {
            return await this.sequelize.transaction(async(transaction) => {
                const location = await models.Geolocation.findOne({ where: { userID: userID } });
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

    async getPendingMatches(id)
    {
        var matches = [];
        await models.Match.findAll({where: {requester_id: id, provider_id: { [Op.ne]: '' }, requester_score: { [Op.eq]: 0}}})
        .then((data) =>
        {
            console.log(data);
            for (let match in data)
            {
                console.log(match);
                matches.push({match: data[match].dataValues, type: 'request'});
            }
            console.log(matches);
        });
        await models.Match.findAll({where: {provider_id: id, requester_id: { [Op.ne]: '' }, provider_score: { [Op.eq]: 0}}})
        .then((data) =>
        {
            console.log(data);
            for (let match in data)
            {
                console.log(match);
                matches.push({match: data[match], type: 'offer'});
            }
            console.log(matches);
        });
        return matches;
    }


    async updateRating(id, rating, type)
    {
        await models.Match.findOne({where: {id: id}})
        .then((match) => {
            console.log(match);
            if(type === 'request'){
                match.update({requester_score: rating});
            }
            else{
                match.update({provider_score: rating});
            }
        });
    }

    /**
     * Creates a new router for the locations.
     *
     * @returns {express~Router} The router.
     */
    router() {
        // Router for a single location.
        const matchHistoryRouter = Router();

        // Attempts to create a new location.
        matchHistoryRouter.put(
            '/',
            bodyParser.json(),
            async(req, res) => {
                //const { id } = req;

                try {
                    console.log('put try');
                    //console.log(req.body);

                    if (req.body.rating != null)
                    {
                        await this.updateRating(req.body.matchID, req.body.rating, req.body.type)
                        .then((result) =>
                        {
                            res.status(201);
                            res.end();
                        })
                    }
                    else {
                        if (!req.body) {
                            throw new Error('Missing request data.');
                        }
    
                        console.log('Attempting to insert');
                        const { user } = req;
                        const match_record = await this.insert(
                            req.body, user
                        )
                        .then((match_record) => {
                            console.log('Inserted successfully');
                            res.status(201);
                            res.json(match_record.id);
                            res.end();
                        });   
                    }
                    
                } catch (err) {
                    // Creation failed; report error.
                    console.log('Error occurred');
                    console.log(err);
                    res.set('Content-Type', 'text/plain')
                        .status(401)
                        .send(err.message)
                        .end();
                }
            }
        );

        // Gets information about the specified location.
        matchHistoryRouter.get(
            '/',
            bodyParser.json(),
            async(req, res) => {
                try {
                    console.log('get try');
                    var reqbody = req.query;
                    console.log(reqbody);
                
                    if (!req) {
                        throw new Error('Missing request data.');
                    }

                    if( req.query.type === 'getPending')
                    {
                        await this.getPendingMatches(req.query.id)
                        .then((data) => 
                        {
                            console.log(data);
                            res.status(201);
                            res.json(data).end();
                        })
                    }

                } catch (err) {
                    // Creation failed; report error.
                    console.log('Error occurred');
                    console.log(err);
                    res.status(400);
                    res.json(err.message)
                        .end();
                }
            }
            
        );

        return matchHistoryRouter;
    }

}

Object.freeze(MatchHistory);
module.exports = MatchHistory;
