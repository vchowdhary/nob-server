'use strict';

module.exports = (sequelize, Sequelize) => {
    var Match = sequelize.define(
        'Match',
        {
            
            requester_id:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            provider_id:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            service_type:
            {
                type: Sequelize.STRING,
                allowNull: false
                //primaryKey: true
            },
            subject_1:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            subject_2:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            subject_3:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            details:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            time:
            {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            location:
            {
                type: Sequelize.JSON,
                allowNull: true
            },
            timetodeliver:
            {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            provider_score:
            {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            requester_score:
            {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            dropOffLocation:
            {
                type: Sequelize.JSON,
                allowNull: true
            }
        }
    );

    

    return Match;
};