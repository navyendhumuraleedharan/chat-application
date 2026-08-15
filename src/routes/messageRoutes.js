import express from 'express';

import { validate } from '../middlewares/validateMiddleware.js';

import { getMessages, sendMessage } from '../controllers/messageController.js';

import { protect } from '../middlewares/authMiddleware.js';
import { createMessageSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', validate(createMessageSchema), sendMessage);

export default router;
