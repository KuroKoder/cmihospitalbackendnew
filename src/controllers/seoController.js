const { SeoMeta } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class SeoMetaController {
  // Get all SEO meta
  async getAll(req, res) {
    try {
      const seoMeta = await SeoMeta.findAll();
      res.json({
        success: true,
        data: seoMeta
      });
    } catch (error) {
      logger.error('Error fetching SEO meta:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching SEO meta',
        error: error.message
      });
    }
  }

  // Create new SEO meta
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { model_type, model_id, seo_title, seo_description, seo_keywords } = req.body;

      const seoMeta = await SeoMeta.create({
        model_type,
        model_id,
        seo_title,
        seo_description,
        seo_keywords
      });

      logger.info(`SEO Meta created: ${seoMeta.id}`);

      res.status(201).json({
        success: true,
        message: 'SEO Meta created successfully',
        data: seoMeta
      });
    } catch (error) {
      logger.error('Error creating SEO meta:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating SEO meta',
        error: error.message
      });
    }
  }

  // Update SEO meta
  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const seoMeta = await SeoMeta.findByPk(id);

      if (!seoMeta) {
        return res.status(404).json({
          success: false,
          message: 'SEO Meta not found'
        });
      }

      const { seo_title, seo_description, seo_keywords } = req.body;

      await seoMeta.update({
        seo_title,
        seo_description,
        seo_keywords
      });

      logger.info(`SEO Meta updated: ${id}`);

      res.json({
        success: true,
        message: 'SEO Meta updated successfully',
        data: seoMeta
      });
    } catch (error) {
      logger.error('Error updating SEO meta:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating SEO meta',
        error: error.message
      });
    }
  }

  // Delete SEO meta
  async delete(req, res) {
    try {
      const { id } = req.params;
      const seoMeta = await SeoMeta.findByPk(id);

      if (!seoMeta) {
        return res.status(404).json({
          success: false,
          message: 'SEO Meta not found'
        });
      }

      await seoMeta.destroy();

      logger.info(`SEO Meta deleted: ${id}`);

      res.json({
        success: true,
        message: 'SEO Meta deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting SEO meta:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting SEO meta',
        error: error.message
      });
    }
  }
}

module.exports = new SeoMetaController();
