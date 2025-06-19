const express = require('express');
const router = express.Router();
const ArticleController = require('../../controllers/articleController');
const { validateArticle } = require('../../validators/articleValidator'); // Pastikan Anda memiliki validator

// Routes untuk artikel
router.get('/', ArticleController.getAll);
router.get('/:slug', ArticleController.getBySlug);
router.post('/', validateArticle, ArticleController.create);
router.put('/:id', validateArticle, ArticleController.update);
router.delete('/:id', ArticleController.delete);
router.get('/:slug/related', ArticleController.getRelated);
router.get('/popular', ArticleController.getPopular);
router.put('/bulk-status', ArticleController.bulkUpdateStatus);

module.exports = router;
