const express = require('express');
const router = express.Router();
const CategoryController = require('../../controllers/categoryController');
const { validateCategory } = require('../../validators/categoryValidator'); // Pastikan Anda memiliki validator

// Routes untuk kategori
router.get('/', CategoryController.getAll);
router.get('/tree', CategoryController.getTree);
router.get('/:slug', CategoryController.getBySlug);
router.post('/', validateCategory, CategoryController.create);
router.put('/:id', validateCategory, CategoryController.update);
router.delete('/:id', CategoryController.delete);
router.put('/reorder', CategoryController.reorder);
router.get('/:id/stats', CategoryController.getStats);


module.exports = router;
