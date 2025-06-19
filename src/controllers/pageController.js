const { Page } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class PageController {
  // Get all pages with SEO optimization
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;
      const whereClause = {};

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const pages = await Page.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]]
      });

      // Generate SEO meta for listing page
      const seoMeta = {
        title: 'Pages',
        description: 'Browse our pages for more information',
        canonical: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      };

      res.json({
        success: true,
        data: {
          pages: pages.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(pages.count / limit),
            totalItems: pages.count,
            hasNext: page < Math.ceil(pages.count / limit),
            hasPrev: page > 1
          },
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error fetching pages:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pages',
        error: error.message
      });
    }
  }

  // Get single page by slug with SEO
  async getBySlug(req, res) {
    try {
      const { slug } = req.params;

      const page = await Page.findOne({ where: { slug } });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }

      // Generate SEO meta tags
      const seoMeta = {
        title: page.seo_title || page.title,
        description: page.seo_description || page.content.substring(0, 160),
        canonical: `${req.protocol}://${req.get('host')}/pages/${slug}`
      };

      res.json({
        success: true,
        data: {
          page,
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error fetching page:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching page',
        error: error.message
      });
    }
  }

  // Create new page
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

      const { title, content, seo_title, seo_description } = req.body;

      const slug = await generateSlug(title, Page);

      const page = await Page.create({
        title,
        slug,
        content,
        seo_title: seo_title || title,
        seo_description: seo_description || content.substring(0, 160)
      });

      logger.info(`Page created: ${page.id}`);

      res.status(201).json({
        success: true,
        message: 'Page created successfully',
        data: page
      });
    } catch (error) {
      logger.error('Error creating page:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating page',
        error: error.message
      });
    }
  }

  // Update page
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
      const page = await Page.findByPk(id);

      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }

      const { title, content, seo_title, seo_description } = req.body;

      const updateData = {
        title,
        content,
        seo_title: seo_title || title,
        seo_description: seo_description || content.substring(0, 160)
      };

      await page.update(updateData);

      logger.info(`Page updated: ${id}`);

      res.json({
        success: true,
        message: 'Page updated successfully',
        data: page
      });
    } catch (error) {
      logger.error('Error updating page:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating page',
        error: error.message
      });
    }
  }

  // Delete page
  async delete(req, res) {
    try {
      const { id } = req.params;
      const page = await Page.findByPk(id);

      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }

      await page.destroy();

      logger.info(`Page deleted: ${id}`);

      res.json({
        success: true,
        message: 'Page deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting page:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting page',
        error: error.message
      });
    }
  }
}

module.exports = new PageController();
