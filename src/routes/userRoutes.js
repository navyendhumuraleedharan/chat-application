import express from 'express';
import { getAllUsers, searchUsers } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

// GET /api/users/all?cursor=65f8a...&limit=20
router.get('/all', getAllUsers);

// GET /api/users/search?q=john
router.get('/search', searchUsers);

export default router;
