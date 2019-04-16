'use strict';
var Sequelize = require('sequelize');
var models = require('../models');

/**
 * Maximum text area length, in bytes.
 *
 * @private
 * @readonly
 * @type {number}
 */
const TEXTAREA_MAXLEN = 2047;

/**
 * Profile attributes.
 *
 * @private
 */
const ProfileAttrs =
    {
        /**
         * User ID.
         *
         * @type {string}
         * 
         */
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            references: {
                model: models.User,
                key: 'id'
            }
        },

        /**
         * First name.
         *
         * @type {string}
         */
        nameFirst: { type: Sequelize.STRING, allowNull: false },

        /**
         * Last name.
         *
         * @type {string}
         */
        nameLast: { type: Sequelize.STRING, allowNull: false },

        /**
         * Phone number.
         *
         * @type {string?}
         */
        phone: { type: Sequelize.STRING },

        /**
         * Extended biography.
         *
         * @type {string?}
         */
        bio: { type: Sequelize.STRING(TEXTAREA_MAXLEN) },

        /**
         * Tutoring skills
         * @type {Object.<string, number, string>}
         */
        tutoring: { type: Sequelize.JSON, allowNull: true },

        /**
         * Delivery
         * @type {boolean}
         */
        delivery: { 
            type: Sequelize.JSON,
            allowNull: true
        },

        tutoringNeeds: { 
            type: Sequelize.JSON,
            allowNull: true
        },

        deliveryNeeds: { 
            type: Sequelize.JSON,
            allowNull: true
        }
    };

module.exports = (sequelize) => {
    var Profile = sequelize.define(
        'Profile',
        ProfileAttrs
    );

    Profile.associate = function(models) {
        models.Profile.belongsTo(models.User, {
            foreignKey: 'id',
            onDelete: 'CASCADE'
        });
    };
    
    return Profile;
};