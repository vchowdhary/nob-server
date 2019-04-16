'use strict';

/**
 * Length of bcrypt hash.
 *
 * @private
 * @readonly
 * @type {number}
 */
const BCRYPT_PW_HASHLEN = 60;


module.exports = (sequelize, Sequelize) => {
    var User = sequelize.define('User', {
        /**
         * The user's ID.
         *
         * @type {string}
         */
        id: {
            type: Sequelize.STRING,
            primaryKey: true
        },

        /**
         * The user's password hash.
         *
         * @type {string}
         */
        pwHash: {
            type: Sequelize.CHAR(BCRYPT_PW_HASHLEN),
            allowNull: false
        }
    });

    User.associate = function(models) {
        models.User.hasOne(models.Profile, {
            foreignKey: 'id',
            onDelete: 'CASCADE'
        });

        models.User.belongsToMany(models.Match, {
            through: 'MatchHistory',
            as: 'offer',
            foreignKey: 'provider_id',
            otherKey: 'userId',
            onDelete: 'CASCADE'
        });

        models.User.hasMany(models.Geolocation, {
            foreignKey: 'userID',
            onDelete: 'CASCADE'
        });
    };

    return User;
};