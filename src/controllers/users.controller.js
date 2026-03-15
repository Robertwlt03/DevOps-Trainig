import logger from '#config/logger.js';
import { formatValidationError } from '#utils/format.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.services.js';
import {
  updateUserSchema,
  userIdSchema,
} from '#validations/users.validation.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved all users.',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const id = Number(validationResult.data.id);

    logger.info(`Getting user by id: ${id}`);

    const user = await getUserByIdService(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Successfully retrieved user.',
      user,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idResult = userIdSchema.safeParse({ id: req.params.id });

    if (!idResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idResult.error),
      });
    }

    const bodyResult = updateUserSchema.safeParse(req.body);

    if (!bodyResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyResult.error),
      });
    }

    const targetUserId = Number(idResult.data.id);
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const isAdmin = authenticatedUser.role === 'admin';
    const isSelf = authenticatedUser.id === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own user account',
      });
    }

    const updates = { ...bodyResult.data };

    if (Object.prototype.hasOwnProperty.call(updates, 'role') && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can change user roles',
      });
    }

    logger.info(`Updating user ${targetUserId}`, {
      byUserId: authenticatedUser.id,
      role: authenticatedUser.role,
    });

    try {
      const updatedUser = await updateUserService(targetUserId, updates);

      res.json({
        message: 'User updated successfully.',
        user: updatedUser,
      });
    } catch (e) {
      if (e.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw e;
    }
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const targetUserId = Number(validationResult.data.id);
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const isAdmin = authenticatedUser.role === 'admin';
    const isSelf = authenticatedUser.id === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own user account',
      });
    }

    logger.info(`Deleting user ${targetUserId}`, {
      byUserId: authenticatedUser.id,
      role: authenticatedUser.role,
    });

    try {
      await deleteUserService(targetUserId);

      res.status(204).send();
    } catch (e) {
      if (e.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw e;
    }
  } catch (e) {
    logger.error(e);
    next(e);
  }
};
