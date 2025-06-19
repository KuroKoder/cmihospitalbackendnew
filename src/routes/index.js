const express = require('express');
const router = express.Router();
const articleRoutes = require('./api/article');
const categoryRoutes = require('./api/categories');
const doctorRoutes = require('./api/doctors');
const pageRoutes = require('./api/pages');
const seoRoutes = require('./api/seo');

// Define your routes
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/doctors', doctorRoutes);
router.use('/pages', pageRoutes);
router.use('/seo', seoRoutes);

module.exports = router;
