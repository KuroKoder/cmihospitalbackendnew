const { models } = require('../models');
const { Category, Article, User } = models;
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { generateSlug } = require('../utils/helpers');
const logger = require('../utils/logger');
const sequelize = require('../config/sequelize');

class CategoryController {
  // Get all categories with hierarchy
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        active,
        parent_id,
        search,
        sortBy = 'sort_order',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by active status
      if (active !== undefined) {
        whereClause.is_active = active === 'true';
      }

      // Filter by parent
      if (parent_id !== undefined) {
        whereClause.parent_id = parent_id === 'null' ? null : parent_id;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const categories = await Category.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Article,
            as: 'articles',
            attributes: ['id'],
            where: { status: 'published' },
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Add article count to each category
      const categoriesWithCount = categories.rows.map(category => ({
        ...category.toJSON(),
        article_count: category.articles ? category.articles.length : 0,
        articles: undefined // Remove articles array from response
      }));

      // Generate SEO meta for category listing
      const seoMeta = {
        title: 'Medical Categories',
        description: 'Browse our medical categories and specialties',
        canonical: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      };

      res.json({
        success: true,
        data: {
          categories: categoriesWithCount,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(categories.count / limit),
            totalItems: categories.count,
            hasNext: page < Math.ceil(categories.count / limit),
            hasPrev: page > 1
          },
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  }

  // Get category hierarchy tree
  async getTree(req, res) {
    try {
      const { active = true } = req.query;
      const whereClause = active ? { is_active: true } : {};

      const categories = await Category.findAll({
        where: whereClause,
        include: [
          {
            model: Article,
            as: 'articles',
            attributes: ['id'],
            where: { status: 'published' },
            required: false
          }
        ],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      // Build tree structure
      const categoryMap = new Map();
      const tree = [];

      // First pass: create all categories with article counts
      categories.forEach(category => {
        const categoryData = {
          ...category.toJSON(),
          article_count: category.articles ? category.articles.length : 0,
          articles: undefined,
          children: []
        };
        categoryMap.set(category.id, categoryData);
      });

      // Second pass: build hierarchy
      categoryMap.forEach(category => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(category);
          }
        } else {
          tree.push(category);
        }
      });

      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      logger.error('Error fetching category tree:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category tree',
        error: error.message
      });
    }
  }

  // Get single category by slug with SEO
  async getBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { 
        articlePage = 1, 
        articleLimit = 10,
        articleSortBy = 'published_at',
        articleSortOrder = 'DESC'
      } = req.query;

      const category = await Category.findOne({
        where: { slug, is_active: true }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Get articles in this category with pagination
      const articleOffset = (articlePage - 1) * articleLimit;
      const articles = await Article.findAndCountAll({
        where: { 
          categoryId: category.id,
          status: 'published'
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'avatar']
          }
        ],
        limit: parseInt(articleLimit),
        offset: articleOffset,
        order: [[articleSortBy, articleSortOrder]]
      });

      // Generate SEO meta
      const seoMeta = {
        title: category.seo_title || `${category.name} - Medical Articles`,
        description: category.seo_description || category.description || `Browse articles about ${category.name}`,
        keywords: category.seo_keywords,
        canonical: `${req.protocol}://${req.get('host')}/categories/${slug}`,
        openGraph: {
          title: category.name,
          description: category.description,
          image: category.image,
          url: `${req.protocol}://${req.get('host')}/categories/${slug}`,
          type: 'website'
        }
      };

      res.json({
        success: true,
        data: {
          category,
          articles: {
            data: articles.rows,
            pagination: {
              currentPage: parseInt(articlePage),
              totalPages: Math.ceil(articles.count / articleLimit),
              totalItems: articles.count,
              hasNext: articlePage < Math.ceil(articles.count / articleLimit),
              hasPrev: articlePage > 1
            }
          },
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category',
        error: error.message
      });
    }
  }

  // Create new category
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
        name,
        description,
        image,
        parent_id,
        sort_order = 0,
        is_active = true,
        seo_title,
        seo_description,
        seo_keywords
      } = req.body;

      // Generate slug
      const slug = await generateSlug(name, Category);

      // Validate parent category exists
      if (parent_id) {
        const parentCategory = await Category.findByPk(parent_id);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }

      const category = await Category.create({
        name,
        slug,
        description,
        image,
        parent_id,
        sort_order,
        is_active,
        seo_title: seo_title || name,
        seo_description: seo_description || description,
        seo_keywords
      });

      logger.info(`Category created: ${category.id} by user ${req.user?.id || 'anonymous'}`);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating category',
        error: error.message
      });
    }
  }

  // Update category
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
      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const {
        name,
        description,
        image,
        parent_id,
        sort_order,
        is_active,
        seo_title,
        seo_description,
        seo_keywords
      } = req.body;

      const updateData = {};

      // Only update provided fields
      if (name !== undefined) {
        updateData.name = name;
        if (name !== category.name) {
          updateData.slug = await generateSlug(name, Category, id);
        }
      }

      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (sort_order !== undefined) updateData.sort_order = sort_order;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (seo_title !== undefined) updateData.seo_title = seo_title;
      if (seo_description !== undefined) updateData.seo_description = seo_description;
      if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;

      // Handle parent category change
      if (parent_id !== undefined) {
        if (parent_id === id) {
          return res.status(400).json({
            success: false,
            message: 'Category cannot be its own parent'
          });
        }

        if (parent_id) {
          const parentCategory = await Category.findByPk(parent_id);
          if (!parentCategory) {
            return res.status(400).json({
              success: false,
              message: 'Parent category not found'
            });
          }

          // Check for circular reference
          const isCircular = await this.checkCircularReference(id, parent_id);
          if (isCircular) {
            return res.status(400).json({
              success: false,
              message: 'Circular reference detected'
            });
          }
        }

        updateData.parent_id = parent_id;
      }

      updateData.updated_at = new Date();

      await category.update(updateData);

      logger.info(`Category updated: ${id} by user ${req.user?.id || 'anonymous'}`);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating category',
        error: error.message
      });
    }
  }

  // Delete category
  async delete(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has children
      const childrenCount = await Category.count({
        where: { parent_id: id }
      });

      if (childrenCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with subcategories'
        });
      }

      // Check if category has articles
      const articleCount = await Article.count({
        where: { categoryId: id }
      });

      if (articleCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with associated articles'
        });
      }

      await category.destroy();

      logger.info(`Category deleted: ${id} by user ${req.user?.id || 'anonymous'}`);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting category',
        error: error.message
      });
    }
  }

  // Reorder categories
  async reorder(req, res) {
    try {
      const { categories } = req.body;

      if (!categories || !Array.isArray(categories)) {
        return res.status(400).json({
          success: false,
          message: 'Categories array is required'
        });
      }

      // Update sort order for each category
      const updatePromises = categories.map((cat, index) => {
        return Category.update(
          { sort_order: index },
          { where: { id: cat.id } }
        );
      });

      await Promise.all(updatePromises);

      logger.info(`Categories reordered by user ${req.user?.id || 'anonymous'}`);

      res.json({
        success: true,
        message: 'Categories reordered successfully'
      });
    } catch (error) {
      logger.error('Error reordering categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error reordering categories',
        error: error.message
      });
    }
  }

  // Helper method to check circular reference
  async checkCircularReference(categoryId, parentId) {
    try {
      let currentParentId = parentId;
      const visited = new Set();

      while (currentParentId) {
        if (visited.has(currentParentId) || currentParentId === categoryId) {
          return true; // Circular reference found
        }

        visited.add(currentParentId);

        const parent = await Category.findByPk(currentParentId);
        if (!parent) break;

        currentParentId = parent.parent_id;
      }

      return false;
    } catch (error) {
      logger.error('Error checking circular reference:', error);
      return true; // Assume circular reference to be safe
    }
  }

  // Get category statistics
  async getStats(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Get article counts by status
      const articleStats = await Article.findAll({
        where: { categoryId: id },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Get subcategory count
      const subcategoryCount = await Category.count({
        where: { parent_id: id }
      });

      // Get total views for articles in this category
      const viewStats = await Article.findOne({
        where: { categoryId: id },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('view_count')), 'total_views']
        ],
        raw: true
      });

      const stats = {
        category,
        article_stats: articleStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        subcategory_count: subcategoryCount,
        total_views: parseInt(viewStats.total_views) || 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching category stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category stats',
        error: error.message
      });
    }
  }
}

module.exports = new CategoryController();