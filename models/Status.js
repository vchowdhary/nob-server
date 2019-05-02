'use strict';

module.exports = (sequelize, Sequelize) => {
    var Status = sequelize.define(
        'Status',
        {
            id:
            {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            status:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
        }
    );
    return Status;
};