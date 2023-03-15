/**
 * @typedef { import('../../types/prisma-docs-type') } PrismaClient
 * @typedef { import('../../types/user-docs-type') } User
 * @typedef { import('../../types/pagination-docs-type') } Pagination
 */

const selectQuery = {
    id: true,
    firstName: true,
    lastName: true,
    nif: true,
    profilePicture: {
        select: {
            url: true
        }
    },
    email: true,
    roles: true,
    createdBy: {
        select: {
            id: true,
            nif: true,
            profilePicture: true,
            firstName: true,
            lastName: true,
            email: true,
            roles: true
        }
    },
    updatedAt: true,
    createdAt: true
};

/**
 * Get a user record from database with its id and role
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {string} id - User ID
 * @returns {Promise<{User}>} Promise when resolved returns user
 * @throws {error}
 */
const getUserById = (prisma, id) => {
    return prisma.user.findUnique({
        where: {
            id
        },
        select: selectQuery
    });
};

/**
 * Creates a user record on database with its id and role
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {{id:string, firstName: string, lastName: string, nif: string, email: string, roles: string[], createdBy: string}} obj - User Data
 * @returns {Promise<{User}>} Promise when resolved returns user
 * @throws {error}
 */
const createUser = (prisma, { id, firstName, lastName, nif, email, roles, createdBy }) => {
    return prisma.user.create({
        data: {
            id,
            firstName,
            lastName,
            nif,
            email,
            roles: {
                set: roles
            },
            createdBy: { connect: { id: createdBy } }
        },
        select: selectQuery
    });
};

/**
 * Saves file to the cloud, creates a file record and connects it to the user
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {{id: Number, fileId: String, fileUrl: String, fileType: String }} obj
 * @returns {Promise<User>} - Represents updated user
 * @throws {error}
 */
const addProfilePicture = async (prisma, { id, fileId }) => {
    return prisma.user.update({
        where: { id },
        data: {
            profilePictureId: fileId
        },
        select: selectQuery
    });
};

/**
 * Checks if there is a record of profilePicture for the user
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {Number} id - User Id
 * @returns {Promise<{profilePicture: {{id: String, type: String}}}>} - users picture file metadata
 * @throws {error}
 */
const hasProfilePicture = (prisma, id) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            profilePicture: {
                select: {
                    url: true
                }
            }
        }
    });
};

/**
 * Retrieves all users with the filter options
 * @param {PrismaClient} prisma
 * @param {{role: String, filter: String}} obj
 * @returns {Promise<{}[]>} - Returns a Promise when resolved returns array with users and users total count
 */
const listAllUsers = (prisma, { role, filter, pagination }) => {
    const mutatedFilter = filter ?? '';
    const textQueries = {
        OR: [
            { email: { contains: mutatedFilter, mode: 'insensitive' } },
            { nif: { contains: mutatedFilter, mode: 'insensitive' } },
            { firstName: { contains: mutatedFilter, mode: 'insensitive' } },
            { lastName: { contains: mutatedFilter, mode: 'insensitive' } }
        ]
    };

    const whereQuery = !role ? textQueries : { ...textQueries, AND: { roles: { has: role } } };

    return Promise.all([
        prisma.user.findMany({
            where: whereQuery,
            skip: pagination.pastRecordsCount,
            take: pagination.pageSize,
            select: selectQuery
        }),
        prisma.user.count({ where: whereQuery })
    ]);
};

/**
 * Returns a promise that deletes user by id
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {string} id - User ID
 * @returns {Promise}
 * @throws {error}
 */
const deleteUserById = (prisma, id) =>
    prisma.user.delete({
        where: { id },
        select: { id: true, profilePicture: { select: { id: true, type: true } } }
    });

/**
 * Retrieves all User Products by ID
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {id: string, pagination: pagination} obj - data
 * @returns {Promise}
 */
const getAllUserProducts = (prisma, { id, pagination }) => {
    return Promise.all([
        prisma.user.findUnique({
            where: { id },
            select: {
                products: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true,
                        images: true,
                        categories: true,
                        supplier: true,
                        updatedAt: true,
                        createdAt: true
                    },
                    take: pagination.pageSize,
                    skip: pagination.pastRecordsCount
                }
            }
        }),
        prisma.product.count({
            where: {
                userId: id
            }
        })
    ]);
};

/**
 * Returns the user created categories paginated and the total records count
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {{id: string, pagination: Pagination}} obj - Data
 * @returns {Promise}
 */
const getAllUserCategories = (prisma, { id, pagination }) => {
    const categorySelect = {
        id: true,
        name: true,
        createdAt: true,
        updateAt: true
    };

    return Promise.all([
        prisma.user.findUnique({
            where: { id },
            select: {
                categories: {
                    select: categorySelect,
                    take: pagination.pageSize,
                    skip: pagination.pastRecordsCount
                }
            }
        }),
        prisma.category.count({ where: { userId: id } })
    ]);
};

/**
 * Returns the user created suppliers paginated and the total records count
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {{id: string, pagination: Pagination}} obj - Data
 * @returns {Promise}
 * @throws {error}
 */
const getAllUserSuppliers = (prisma, { id, pagination }) => {
    const supplierSelect = {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
        nif: true
    };

    return Promise.all([
        prisma.user.findUnique({
            where: { id },
            select: {
                suppliers: {
                    select: supplierSelect,
                    take: pagination.pageSize,
                    skip: pagination.pastRecordsCount
                }
            }
        }),
        prisma.supplier.count({ where: { userId: id } })
    ]);
};

/**
 * Returns Promise when resolved has the user id and roles
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {string} id - User ID
 * @returns {Promise}
 * @throws {error}
 */
const getUserRoles = (prisma, id) =>
    prisma.user.findUnique({ where: { id }, select: { id: true, roles: true } });

module.exports = {
    getUserById,
    createUser,
    addProfilePicture,
    hasProfilePicture,
    listAllUsers,
    deleteUserById,
    getAllUserProducts,
    getAllUserCategories,
    getAllUserSuppliers,
    getUserRoles
};
