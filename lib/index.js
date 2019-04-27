#!/usr/bin/env node
/* eslint-disable no-unused-vars */


/* eslint-disable max-statements */
/**
 * Night Owl Bakery server.
 *
 * @module night-owl-bakery
 */

'use strict';

const path = require("path");
const express = require('express');
const historyFallback = require('connect-history-api-fallback');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const Users = require('./Users');
const MatchQuery = require('./MatchQuery');
const LocationTracking = require('./LocationTracking');
const TutoringSubjects = require('./TutoringSubjects');
const FirebaseTokens = require('./FirebaseTokens');
const NotificationManager = require('./NotificationManager');
const MatchNotificationManager = require('./MatchNotificationManager');
const bodyParser = require('body-parser');
const matchHistory = require('./MatchHistory');
const models = require('../models');
var db = require('../models').sequelize;

/**
 * Configures Express app settings from the given object.
 *
 * @private
 * @param {express~Application} app - The app to configure.
 * @param {Object} [config] - The configuration.
 */
function configExpress(app, config) {
    if (!config) {
        return;
    }

    Object.keys(config).forEach(key => {
        app.set(key, config[key]);
    });
}

/**
 * Configures user management, authentication, and sessions.
 *
 * @private
 * @param {express~Application} app - The app to configure.
 * @param {string} cookieSecret - Secret for cookies.
 */
function configUsers(app, cookieSecret) {
    app.use('/api', session({
        cookie: {
            httpOnly: false,

            // Secure cookies only work for HTTPS, which will only be the case
            // when we are behind a reverse proxy.
            secure: !!app.get('trust proxy')
        },
        secret: 'abjknACByIWRgnjklk',
        store: new SequelizeStore({ db: db }),
        saveUninitialized: false,
        resave: false   // SequelizeStore supports the "touch" method.
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    const users = new Users(models.sequelize);
    const locations = new LocationTracking(models.sequelize);
    const matches = new matchHistory(models.sequelize);
    const subjects = new TutoringSubjects(models.sequelize);
    const tokens = new FirebaseTokens(models.sequelize);
    const notifications = new NotificationManager(models.sequelize);
    const matchNotifications = new MatchNotificationManager(models.sequelize);
    const { auth } = users;

    console.log('setting up apis');
    app.use(auth.initialize());
    app.use(auth.session());
    console.log('setting up users');
    app.use('/api/users', users.router());
    console.log('setting up matches');
    app.use('/api/match', MatchQuery.router(users));
    console.log('setting up location');
    app.use('/api/locationtracking', locations.router());
    app.use('/api/history', matches.router());
    console.log('setting up subjects');
    app.use('/api/subjects', subjects.router());
    console.log('setting up tokens');
    app.use('/api/tokens', tokens.router());
    app.use('/api/notifications', notifications.router());
    app.use('/api/matchnotifications', matchNotifications.router());
}

/**
 * Configures static file serving from the given paths.
 *
 * Also enables single-page-app history API fallback.
 *
 * @private
 * @param {express~Application} app - The app to configure.
 * @param {string[]} [staticPaths] - The paths.
 */
function configStatic(app, staticPaths) {
    app.use(historyFallback());

    if (!staticPaths) {
        return;
    }

    staticPaths.forEach(dir => {
        app.use(express.static(dir));
    });

    // Always serve 'public' directory if static files are enabled.
    app.use(express.static(
        path.resolve(__dirname, '../public')
    ));
}

/**
 * Configures a server and starts it.
 *
 * @alias module:night-owl-bakery
 *
 * @param {Object} config - App configuration options.
 *
 * @param {string} config.dataPath - Path to data directory.
 * @param {string} config.cookieSecret - Secret for cookies.
 * @param {string} config.hostname - The server's hostname.
 * @param {number} config.port - The server's listening port.
 * @param {Object} [config.express] - Express app settings.
 * @param {string[]} [config.staticPaths] - Static file paths to serve (no files
 * will be served statically if unspecified).
 * @param {Function[]} [config.middlewares] - Additional middlewares to apply.
 *
 * @returns {http.Server} - Resolve with the listening server.
 */
async function serve(config) {
    const {
        cookieSecret, hostname, port
    } = config;

    // Configure app.
    console.log('configuring app');
    const app = express();
    configExpress(app, config.express);
    configUsers(app, cookieSecret);
    configStatic(app, config.staticPaths);

    // Pull in middlewares from configuration.
    if ('middlewares' in config) {
        app.use.apply(app, config.middlewares);
    }

    // Configuration finalized; synchronize models.
    await models.sequelize.sync();
    
    const server = app.listen(5000, () => {
        const { address, port } = server.address();
        console.log(`Listening at http://${address}:${port}`);
      });

    return server;
}

module.exports = serve;

/**
 * The command-line interface of the app.
 *
 * @private
 * @param {string[]} argv - The command-line arguments.
 */
async function cli(argv) {
    // Default configuration.
    const config = {
        hostname: 'localhost',
        port: 5000,
        staticPaths: [
        ]
    };

    console.log('awaiting server');
    const server = await serve(config);
    console.log('waited for server');
    server.address();
   
}

cli(process.argv)
    .catch(err => {
        console.error(err);
        process.exit(1);    // eslint-disable-line no-process-exit
    });

