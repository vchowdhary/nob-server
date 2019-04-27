'use strict';

module.exports = (sequelize, Sequelize) => {
    var MatchNotification = sequelize.define(
        'MatchNotification',
        {
            matches: {
                type: Sequelize.STRING,
                allowNull: true
            },
            message:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            statuses: 
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            matchID: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            maxAttempt: {
                type: Sequelize.INTEGER,
                allowNull: true
            }
        }
    );
    return MatchNotification;
};