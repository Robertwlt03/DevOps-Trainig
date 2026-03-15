import express from 'express';
import {
  fetchAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = express.Router();

// GET /users - Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), fetchAllUsers);

// GET /users/:id - Get user by ID (authenticated users only)
router.get('/:id', authenticateToken, getUserById);

// PUT /users/:id - Update user by ID (authenticated users can update own profile, admin can update any)
router.put('/:id', authenticateToken, updateUser);

// DELETE /users/:id - Delete user by ID (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteUser);

export default router;
