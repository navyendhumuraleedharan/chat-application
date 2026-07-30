import express from 'express';
import {
  createOrGetConversation,
  getMyConversations,
} from '../controllers/conversationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', createOrGetConversation);
router.get('/', getMyConversations);

export default router;
