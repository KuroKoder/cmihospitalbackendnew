const pool = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const { generateSlug, calculateReadingTime } = require('../utils/helpers');

class ArticleController {
  // Get all articles with pagination and filters
  async getArticles(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status = 'published',
        search,
        featured,
        sort = 'published_at'
      } = req.query;

      const offset = (page - 1) * limit;
      const cacheKey = `articles:${JSON.stringify(req.query)}`;

      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      let query = `
        SELECT 
          a.*,
          u.name as author_name,
          c.name as category_name,
          c.slug as category_slug
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = $1
      `;
      
      const params = [status];
      let paramCount = 1;

      if (category) {
        paramCount++;
        query += ` AND c.slug = $${paramCount}`;
        params.push(category);
      }

      if (search) {
        paramCount++;
        query += ` AND (
          a.title ILIKE $${paramCount} OR 
          a.excerpt ILIKE $${paramCount} OR
          to_tsvector('english', a.content) @@ plainto_tsquery('english', $${paramCount})
        )`;
        params.push(`%${search}%`);
      }

      if (featured !== undefined) {
        paramCount++;
        query += ` AND a.is_featured = $${paramCount}`;
        params.push(featured === 'true');
      }

      // Add sorting
      const allowedSorts = ['published_at', 'view_count', 'title', 'created_at'];
      const sortField = allowedSorts.includes(sort) ? sort : 'published_at';
      query += ` ORDER BY a.${sortField} DESC`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = $1
      `;
      const countParams = [status];
      let countParamCount = 1;

      if (category) {
        countParamCount++;
        countQuery += ` AND c.slug = $${countParamCount}`;
        countParams.push(category);
      }

      if (search) {
        countParamCount++;
        countQuery += ` AND (
          a.title ILIKE $${countParamCount} OR 
          a.excerpt ILIKE $${countParamCount} OR
          to_tsvector('english', a.content) @@ plainto_tsquery('english', $${countParamCount})
        )`;
        countParams.push(`%${search}%`);
      }

      if (featured !== undefined) {
        countParamCount++;
        countQuery += ` AND a.is_featured = $${countParamCount}`;
        countParams.push(featured === 'true');
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      const response = {
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(response));

      res.json(response);
    } catch (error) {
      logger.error('Error getting articles:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get single article by slug
  async getArticle(req, res) {
    try {
      const { slug } = req.params;
      const cacheKey = `article:${slug}`;

      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        // Increment view count asynchronously
        this.incrementViewCount(slug);
        return res.json(JSON.parse(cached));
      }

      const query = `
        SELECT 
          a.*,
          u.name as author_name,
          u.avatar as author_avatar,
          c.name as category_name,
          c.slug as category_slug
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.slug = $1 AND a.status = 'published'
      `;

      const result = await pool.query(query, [slug]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      const article = result.rows[0];

      // Get related articles
      const relatedQuery = `
        SELECT id, title, slug, excerpt, featured_image, published_at
        FROM articles
        WHERE category_id = $1 AND id != $2 AND status = 'published'
        ORDER BY published_at DESC
        LIMIT 3
      `;
      const relatedResult = await pool.query(relatedQuery, [article.category_id, article.id]);

      const response = {
        success: true,
        data: {
          ...article,
          related_articles: relatedResult.rows
        }
      };

      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(response));

      // Increment view count
      this.incrementViewCount(slug);

      res.json(response);
    } catch (error) {
      logger.error('Error getting article:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new article
  async createArticle(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        title,
        content,
        excerpt,
        category_id,
        status = 'draft',
        is_featured = false,
        seo_title,
        seo_description,
        seo_keywords,
        featured_image
      } = req.body;

      const slug = generateSlug(title);
      const reading_time = calculateReadingTime(content);

      const query = `
        INSERT INTO articles (
          title, slug, content, excerpt, category_id, author_id, status,
          is_featured, reading_time, seo_title, seo_description, seo_keywords,
          featured_image, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const published_at = status === 'published' ? new Date() : null;

      const result = await client.query(query, [
        title, slug, content, excerpt, category_id, req.user.id, status,
        is_featured, reading_time, seo_title, seo_description, seo_keywords,
        featured_image, published_at
      ]);

      await client.query('COMMIT');

      // Clear cache
      await this.clearArticleCache();

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Article created successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating article:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Article with this title already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      client.release();
    }
  }

  // Update article
  async updateArticle(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const updateFields = { ...req.body };
      updateFields.updated_at = new Date();

      if (updateFields.title) {
        updateFields.slug = generateSlug(updateFields.title);
      }

      if (updateFields.content) {
        updateFields.reading_time = calculateReadingTime(updateFields.content);
      }

      if (updateFields.status === 'published') {
        updateFields.published_at = new Date();
      }

      const setClause = Object.keys(updateFields)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const query = `
        UPDATE articles 
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      const values = [id, ...Object.values(updateFields)];
      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      await client.query('COMMIT');

      // Clear cache
      await this.clearArticleCache();

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Article updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating article:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      client.release();
    }
  }

  // Delete article
  async deleteArticle(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM articles WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Clear cache
      await this.clearArticleCache();

      res.json({
        success: true,
        message: 'Article deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting article:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Helper methods
  async incrementViewCount(slug) {
    try {
      await pool.query(
        'UPDATE articles SET view_count = view_count + 1 WHERE slug = $1',
        [slug]
      );
    } catch (error) {
      logger.error('Error incrementing view count:', error);
    }
  }

  async clearArticleCache() {
    try {
      const keys = await redis.keys('article*');
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }
}

module.exports = new ArticleController();