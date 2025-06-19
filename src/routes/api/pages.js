const express = require('express');
const router = express.Router();
const PageController = require('../../controllers/pageController');
const { validatePage } = require('../../validators/pageValidator'); // Assuming you have a validator

// Routes for pages
router.get('/', PageController.getAll);
router.get('/:slug', PageController.getBySlug);
router.post('/', validatePage, PageController.create);
router.put('/:id', validatePage, PageController.update);
router.delete('/:id', PageController.delete);

module.exports = router;
