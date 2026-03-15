import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

const baseUserSelect = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  created_at: users.created_at,
  updated_at: users.updated_at,
  updated_from: users.updated_from,
};

export const getAllUsers = async () => {
  try {
    return await db.select(baseUserSelect).from(users);
  } catch (e) {
    logger.error('Error getting users', e);
    throw e;
  }
};

export const getUserById = async (id) => {
  try {
    const [user] = await db
      .select(baseUserSelect)
      .from(users)
      .where(eq(users.id, id));

    return user || null;
  } catch (e) {
    logger.error('Error getting user by id', e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
      })
      .where(eq(users.id, id))
      .returning(baseUserSelect);

    if (!updated) {
      throw new Error('User not found');
    }

    return updated;
  } catch (e) {
    logger.error('Error updating user', e);
    throw e;
  }
};

export const deleteUser = async (id) => {
  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!deleted) {
      throw new Error('User not found');
    }

    return true;
  } catch (e) {
    logger.error('Error deleting user', e);
    throw e;
  }
};