const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.get('/', libraryController.getLibrary);
router.post('/books', libraryController.addBookToLibrary);
router.get('/books/:id', libraryController.getBookDetail);
router.patch('/books/:id', libraryController.updateBookProgress);
router.delete('/books/:id', libraryController.deleteBook);

module.exports = router;