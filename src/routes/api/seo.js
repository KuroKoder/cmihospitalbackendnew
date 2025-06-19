const express = require('express');
const router = express.Router();
const SeoMetaController = require('../../controllers/seoController');
const { validateSeoMeta } = require('../../validators/seoValidator'); // Assuming you have a validator

// Routes for SEO meta
router.get('/', SeoMetaController.getAll);
router.post('/', validateSeoMeta, SeoMetaController.create);
router.put('/:id', validateSeoMeta, SeoMetaController.update);
router.delete('/:id', SeoMetaController.delete);


module.exports = router;
