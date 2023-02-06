/**
 * @typedef { import('../types/prisma-docs-type') } PrismaClient
 */

const { Forbidden, BadRequest } = require('http-errors');

const { createUser: createUserPrisma } = require('../services/prisma/user-service');
const { createUser: createUserFirebase } = require('../services/firebase/user-service');

const decodeToken = async (authService, token) => await authService.verifyIdToken(token);

/**
 * Checks if the user is authorized to make the request
 * Decorates request with user after authorization
 * @param {*} authService - Firebase auth service
 * @param {String[]} roles - Roles that are authorized
 *
 */
const authorize = (authService, roles) => async request => {
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) throw new Forbidden('Missing authorization token');

    try {
        const user = await decodeToken(authService, token);

        if (!user) throw new Forbidden('Invalid authorization token');

        //TODO: Grab roles from prism
        const isAuthorized = roles.every(role => !user.claims?.roles.includes(role));

        if (!isAuthorized) throw new Forbidden('Not Authorized');

        request.user = user;
    } catch (error) {
        if (error.code === 'auth/id-token-expired') throw new Forbidden('Expired token');
    }
};

/**
 * Creates a user in the firebase authentication and adds a record with the role to database
 * @param {{prisma: PrismaClient, authService: *}} obj - Dependencies object
 * @param {{email: string, password: string, name: string, role: string}} obj - user data object
 * @returns {{uid: string, email: string, name: string, role: string}} Obj that represents all user data
 */
//TODO: Encrypt/decrypt password
const createUser = async ({ prisma, authService }, { email, password, name, role }) => {
    try {
        const { uid } = await createUserFirebase(authService, { email, password, name });
        const user = await createUserPrisma(prisma, { id: uid, role });
        return { uid, email, name, role: user.role };
    } catch (error) {
        if (error.code === 'auth/invalid-email' || error.code === 'auth/email-already-exists')
            throw new BadRequest(error.message);

        throw error;
    }
};

module.exports = {
    createUser,
    authorize
};
