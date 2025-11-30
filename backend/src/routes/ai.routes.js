const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/conversations', aiController.getConversations);
router.post('/conversations', aiController.createConversation);
router.get('/conversations/:id', aiController.getConversation);
router.post('/conversations/:id/messages', aiController.sendMessage);
router.delete('/conversations/:id', aiController.deleteConversation);

module.exports = router;