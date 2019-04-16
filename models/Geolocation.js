
'use strict';

module.exports = (sequelize, Sequelize) => {
    var Geolocation = sequelize.define(
        'Geolocation',
        /**@lends module:Location */{
            latitude:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            longitude:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            userID:
            {
                type: Sequelize.STRING,
                allowNull: true
                //primaryKey: true
            }
        },
        { timestamps: true }
    );

    Geolocation.associate = function(models) {
        models.Geolocation.belongsTo(models.User, {
            foreignKey: 'id',
            onDelete: 'CASCADE'
        });
    };
    return Geolocation;
};

