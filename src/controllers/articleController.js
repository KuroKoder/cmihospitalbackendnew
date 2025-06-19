const { Article, Category, User, SeoMeta } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const seoService = require('../services/seoService');
const { generateSlug, calculateReadingTime } = require('../utils/helpers');
const logger = require('../utils/logger');

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
      const structuredData = seoService.generateArticleStructuredData(article);

      // Generate SEO meta tags
      const seoMeta = {
        title: article.seo_title || article.title,
        description: article.seo_description || article.excerpt,
        keywords: article.seo_keywords,
        canonical: article.canonical_url || `${req.protocol}://${req.get('host')}/articles/${slug}`,
        robots: article.meta_robots || 'index,follow',
        structuredData,
        openGraph: {
          title: article.title,
          description: article.excerpt,
          image: article.featured_image,
          url: `${req.protocol}://${req.get('host')}/articles/${slug}`,
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
          seo: seoMeta
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

  // Create new article
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

      const {
        title,
        content,
        excerpt,
        categoryId,
        status = 'draft',
        is_featured = false,
        featured_image,
        seo_title,
        seo_description,
        seo_keywords,
        canonical_url,
        meta_robots = 'index,follow'
      } = req.body;

      // Generate slug
      const slug = await generateSlug(title, Article);

      // Calculate reading time
      const reading_time = calculateReadingTime(content);

      // Auto-generate SEO fields if not provided
      const finalSeoTitle = seo_title || title;
      const finalSeoDescription = seo_description || excerpt || content.substring(0, 160);

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
        published_at: status === 'published' ? new Date() : null,
        seo_title: finalSeoTitle,
        seo_description: finalSeoDescription,
        seo_keywords,
        canonical_url,
        meta_robots,
        schema_markup: seoService.generateArticleStructuredData({
          title,
          excerpt,
          content,
          published_at: status === 'published' ? new Date() : null
        })
      });

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
      logger.error('Error creating article:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating article',
        error: error.message
      });
    }
  }

  // Update article
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
        featured_image,
        seo_title,
        seo_description,
        seo_keywords,
        canonical_url,
        meta_robots
      } = req.body;

      const updateData = {};

      // Only update provided fields
      if (title !== undefined) {
        updateData.title = title;
        if (title !== article.title) {
          updateData.slug = await generateSlug(title, Article, id);
        }
      }

      if (content !== undefined) {
        updateData.content = content;
        updateData.reading_time = calculateReadingTime(content);
      }

      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (featured_image !== undefined) updateData.featured_image = featured_image;
      if (is_featured !== undefined) updateData.is_featured = is_featured;
      if (seo_title !== undefined) updateData.seo_title = seo_title;
      if (seo_description !== undefined) updateData.seo_description = seo_description;
      if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;
      if (canonical_url !== undefined) updateData.canonical_url = canonical_url;
      if (meta_robots !== undefined) updateData.meta_robots = meta_robots;

      // Handle status change
      if (status !== undefined && status !== article.status) {
        updateData.status = status;
        if (status === 'published' && !article.published_at) {
          updateData.published_at = new Date();
        }
      }

      // Update structured data
      updateData.schema_markup = seoService.generateArticleStructuredData({
        ...article.toJSON(),
        ...updateData
      });

      updateData.updated_at = new Date();

      await article.update(updateData);

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

      await article.destroy();

      logger.info(`Article deleted: ${id} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Article deleted successfully'
      });
    } catch (error) {
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