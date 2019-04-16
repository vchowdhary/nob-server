/**
 * Middleware for checking if a request is authenticated.
 *
 * @module isAuthenticated
 */

'use strict';

/**
 * Checks if the request is authenticated.
 *
 * @alias module:isAuthenticated
 *
 * @param {express~Request} req - The request.
 * @param {express~Response} res - The response.
 * @param {Function} next - The callback.
 * @returns {void}
 */
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.set('Content-Type', 'text/plain')
        .status(401)
        .end();
}

module.exports = isAuthenticated;

