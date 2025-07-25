// src/controllers/articleController.js - Updated version with file upload support
const { Article, Category, User, SeoMeta } = require('../models').models;
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const seoService = require('../services/seoService');
const { generateSlug, calculateReadingTime } = require('../utils/helpers');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

class ArticleController {
  // Get all articles with SEO optimization
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'published',
        category,
        featured,
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by status
      if (status) {
        whereClause.status = status;
      }

      // Filter by category
      if (category) {
        whereClause.categoryId = category;
      }

      // Filter by featured
      if (featured !== undefined) {
        whereClause.is_featured = featured === 'true';
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const articles = await Article.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: SeoMeta,
            as: 'seoMeta',
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Generate SEO meta for listing page
      const seoMeta = {
        title: search ? `Search Results for "${search}"` : 'Latest Articles',
        description: 'Browse our latest medical articles and health information',
        canonical: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      };

      res.json({
        success: true,
        data: {
          articles: articles.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(articles.count / limit),
            totalItems: articles.count,
            hasNext: page < Math.ceil(articles.count / limit),
            hasPrev: page > 1
          },
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error fetching articles:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching articles',
        error: error.message
      });
    }
  }

  // Get single article by slug with SEO
  async getBySlug(req, res) {
    try {
      const { slug } = req.params;

      const article = await Article.findOne({
        where: { slug, status: 'published' },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug', 'description']
          },
          {
            model: SeoMeta,
            as: 'seoMeta',
            required: false
          }
        ]
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Increment view count
      await article.increment('view_count');

      // Generate structured data for SEO
      const structuredData = seoService.generateDefaultStructuredData(article);

      // Get SEO meta from separate table or use article defaults
      const seoMeta = article.seoMeta || {};
      
      // Generate SEO meta tags
      const seoMetaTags = {
        title: seoMeta.seo_title || article.title,
        description: seoMeta.seo_description || article.excerpt,
        keywords: seoMeta.seo_keywords,
        canonical: seoMeta.canonical_url || `${req.protocol}://${req.get('host')}/articles/${slug}`,
        robots: seoMeta.meta_robots || 'index,follow',
        structuredData: seoMeta.schema_markup || structuredData,
        openGraph: {
          title: seoMeta.seo_title || article.title,
          description: seoMeta.seo_description || article.excerpt,
          image: article.featured_image,
          url: seoMeta.canonical_url || `${req.protocol}://${req.get('host')}/articles/${slug}`,
          type: 'article',
          publishedTime: article.published_at,
          modifiedTime: article.updated_at,
          author: article.author?.name,
          section: article.category?.name
        }
      };

      res.json({
        success: true,
        data: {
          article,
          seo: seoMetaTags
        }
      });
    } catch (error) {
      logger.error('Error fetching article:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching article',
        error: error.message
      });
    }
  }

  // Create new article with file upload support
  async create(req, res) {
    const transaction = await Article.sequelize.transaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        title,
        content,
        excerpt,
        categoryId,
        status = 'draft',
        is_featured = false,
        seo_title,
        seo_description,
        seo_keywords,
        canonical_url,
        meta_robots = 'index,follow'
      } = req.body;

      // Handle featured image from file upload
      let featured_image = req.body.featured_image; // From form data
      if (req.file && req.file.fieldname === 'featured_image') {
        featured_image = `/uploads/${req.file.path.replace(/\\/g, '/')}`;
      } else if (req.files && req.files.featured_image) {
        featured_image = `/uploads/${req.files.featured_image[0].path.replace(/\\/g, '/')}`;
      }

      // Generate slug
      const slug = await generateSlug(title, Article);

      // Calculate reading time
      const reading_time = calculateReadingTime(content);

      // Create article first
      const article = await Article.create({
        title,
        slug,
        content,
        excerpt,
        categoryId,
        authorId: req.user.id,
        status,
        is_featured,
        featured_image,
        reading_time,
        published_at: status === 'published' ? new Date() : null
      }, { transaction });

      // Create SEO meta if provided
      if (seo_title || seo_description || seo_keywords || canonical_url || meta_robots !== 'index,follow') {
        const defaultUrl = `${req.protocol}://${req.get('host')}/articles/${slug}`;
        
        const structuredData = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": title,
          "description": excerpt || content.substring(0, 160),
          "image": featured_image,
          "datePublished": status === 'published' ? new Date() : null,
          "dateModified": new Date(),
          "author": {
            "@type": "Person",
            "name": req.user.name || "Anonymous"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Medical Website"
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical_url || defaultUrl
          }
        };

        const seoMetaData = {
          model_type: 'Article',
          model_id: article.id,
          seo_title: seo_title || title,
          seo_description: seo_description || excerpt || content.substring(0, 160),
          canonical_url: canonical_url || defaultUrl,
          meta_robots,
          schema_markup: structuredData
        };

        if (seo_keywords) {
          seoMetaData.seo_keywords = seo_keywords;
        }

        await SeoMeta.create(seoMetaData, { transaction });
      }

      await transaction.commit();

      // Load full article with associations
      const fullArticle = await Article.findByPk(article.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: SeoMeta,
            as: 'seoMeta',
            required: false
          }
        ]
      });

      logger.info(`Article created: ${article.id} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: fullArticle
      });
    } catch (error) {
      await transaction.rollback();
      
      // Clean up uploaded files on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          logger.error('Error deleting uploaded file:', err);
        }
      }
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            logger.error('Error deleting uploaded file:', err);
          }
        });
      }

      logger.error('Error creating article:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating article',
        error: error.message
      });
    }
  }

  // Update article with file upload support
  async update(req, res) {
    const transaction = await Article.sequelize.transaction();
    
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
      const article = await Article.findByPk(id, {
        include: [{
          model: SeoMeta,
          as: 'seoMeta',
          required: false
        }]
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Check authorization
      if (req.user.role !== 'admin' && article.authorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this article'
        });
      }

      const {
        title,
        content,
        excerpt,
        categoryId,
        status,
        is_featured,
        seo_title,
        seo_description,
        seo_keywords,
        canonical_url,
        meta_robots,
        remove_featured_image
      } = req.body;

      const updateData = {};

      // Handle title update
      if (title !== undefined) {
        updateData.title = title;
        if (title !== article.title) {
          updateData.slug = await generateSlug(title, Article, id);
        }
      }

      // Handle content update
      if (content !== undefined) {
        updateData.content = content;
        updateData.reading_time = calculateReadingTime(content);
      }

      // Handle other fields
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (is_featured !== undefined) updateData.is_featured = is_featured;

      // Handle featured image update
      if (remove_featured_image === 'true') {
        // Remove existing featured image
        if (article.featured_image) {
          const oldImagePath = path.join(process.cwd(), article.featured_image);
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (err) {
            logger.error('Error deleting old featured image:', err);
          }
        }
        updateData.featured_image = null;
      } else if (req.file && req.file.fieldname === 'featured_image') {
        // New featured image uploaded
        if (article.featured_image) {
          const oldImagePath = path.join(process.cwd(), article.featured_image);
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (err) {
            logger.error('Error deleting old featured image:', err);
          }
        }
        updateData.featured_image = `/uploads/${req.file.path.replace(/\\/g, '/')}`;
      } else if (req.files && req.files.featured_image) {
        // New featured image uploaded via multipart
        if (article.featured_image) {
          const oldImagePath = path.join(process.cwd(), article.featured_image);
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (err) {
            logger.error('Error deleting old featured image:', err);
          }
        }
        updateData.featured_image = `/uploads/${req.files.featured_image[0].path.replace(/\\/g, '/')}`;
      } else if (req.body.featured_image !== undefined) {
        // Featured image URL provided in body
        updateData.featured_image = req.body.featured_image;
      }

      // Handle status change
      if (status !== undefined && status !== article.status) {
        updateData.status = status;
        if (status === 'published' && !article.published_at) {
          updateData.published_at = new Date();
        }
      }

      updateData.updated_at = new Date();

      // Update article
      await article.update(updateData, { transaction });

      // Handle SEO Meta
      const hasSeoData = seo_title || seo_description || seo_keywords || canonical_url || meta_robots;
      
      if (hasSeoData) {
        const structuredData = seoService.generateDefaultStructuredData({
          ...article.toJSON(),
          ...updateData
        });

        const seoUpdateData = {
          seo_title,
          seo_description,
          seo_keywords,
          canonical_url,
          meta_robots,
          schema_markup: structuredData,
          updated_at: new Date()
        };

        // Remove undefined values
        Object.keys(seoUpdateData).forEach(key => {
          if (seoUpdateData[key] === undefined) {
            delete seoUpdateData[key];
          }
        });

        if (article.seoMeta) {
          await article.seoMeta.update(seoUpdateData, { transaction });
        } else {
          await SeoMeta.create({
            model_type: 'Article',
            model_id: article.id,
            ...seoUpdateData
          }, { transaction });
        }
      }

      await transaction.commit();

      // Load updated article with associations
      const updatedArticle = await Article.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: SeoMeta,
            as: 'seoMeta',
            required: false
          }
        ]
      });

      logger.info(`Article updated: ${id} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Article updated successfully',
        data: updatedArticle
      });
    } catch (error) {
      await transaction.rollback();
      
      // Clean up uploaded files on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          logger.error('Error deleting uploaded file:', err);
        }
      }

      logger.error('Error updating article:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating article',
        error: error.message
      });
    }
  }

  // Delete article
  async delete(req, res) {
    const transaction = await Article.sequelize.transaction();
    
    try {
      const { id } = req.params;
      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Check authorization
      if (req.user.role !== 'admin' && article.authorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this article'
        });
      }

      // Delete featured image file
      if (article.featured_image) {
        const imagePath = path.join(process.cwd(), article.featured_image);
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (err) {
          logger.error('Error deleting featured image:', err);
        }
      }

      // Delete related SEO meta first
      await SeoMeta.destroy({
        where: {
          model_type: 'Article',
          model_id: id
        },
        transaction
      });

      // Delete article
      await article.destroy({ transaction });

      await transaction.commit();

      logger.info(`Article deleted: ${id} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Article deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error deleting article:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting article',
        error: error.message
      });
    }
  }

  // Get related articles
  async getRelated(req, res) {
    try {
      const { slug } = req.params;
      const { limit = 5 } = req.query;

      const currentArticle = await Article.findOne({
        where: { slug, status: 'published' }
      });

      if (!currentArticle) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      const relatedArticles = await Article.findAll({
        where: {
          id: { [Op.ne]: currentArticle.id },
          status: 'published',
          categoryId: currentArticle.categoryId
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'avatar']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: SeoMeta,
            as: 'seoMeta',
            required: false
          }
        ],
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: relatedArticles
      });
    } catch (error) {
      logger.error('Error fetching related articles:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching related articles',
        error: error.message
      });
    }
  }

  // Get popular articles
  async getPopular(req, res) {
    try {
      const { limit = 10, days = 30 } = req.query;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const popularArticles = await Article.findAll({
        where: {
          status: 'published',
          published_at: { [Op.gte]: dateFrom }
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'avatar']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: SeoMeta,
            as: 'seoMeta',
            required: false
          }
        ],
        limit: parseInt(limit),
        order: [['view_count', 'DESC'], ['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: popularArticles
      });
    } catch (error) {
      logger.error('Error fetching popular articles:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching popular articles',
        error: error.message
      });
    }
  }

  // Bulk update status
  async bulkUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'IDs array is required'
        });
      }

      if (!['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const updateData = { status, updated_at: new Date() };
      if (status === 'published') {
        updateData.published_at = new Date();
      }

      const [updatedCount] = await Article.update(updateData, {
        where: {
          id: { [Op.in]: ids },
          authorId: req.user.role === 'admin' ? undefined : req.user.id
        }
      });

      logger.info(`Bulk status update: ${updatedCount} articles updated to ${status} by user ${req.user.id}`);

      res.json({
        success: true,
        message: `${updatedCount} articles updated successfully`,
        data: { updatedCount, status }
      });
    } catch (error) {
      logger.error('Error bulk updating articles:', error);
      res.status(500).json({
        success: false,
        message: 'Error bulk updating articles',
        error: error.message
      });
    }
  }
}

module.exports = new ArticleController();