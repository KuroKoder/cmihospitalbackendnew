const { SeoMeta } = require('../models').models;
const logger = require('../utils/logger');

class EnhancedSeoService {
  constructor() {
    // Konfigurasi default untuk berbagai tipe model
    this.defaultConfig = {
      Article: {
        titleTemplate: (title) => `${title} | Medical Knowledge Hub`,
        titleMaxLength: 60,
        descriptionMaxLength: 160,
        keywordsLimit: 10,
        ogType: 'article',
        structuredDataType: 'Article'
      },
      Category: {
        titleTemplate: (name) => `${name} Articles | Medical Knowledge Hub`,
        titleMaxLength: 60,
        descriptionMaxLength: 160,
        keywordsLimit: 8,
        ogType: 'website',
        structuredDataType: 'CollectionPage'
      },
      Doctor: {
        titleTemplate: (name) => `Dr. ${name} | Medical Professional`,
        titleMaxLength: 60,
        descriptionMaxLength: 160,
        keywordsLimit: 8,
        ogType: 'profile',
        structuredDataType: 'Person'
      }
    };
  }

  /**
   * Auto-generate SEO data berdasarkan content model
   * @param {Object} model - Model object (Article, Category, etc.)
   * @param {string} modelType - Type of model
   * @param {Object} customData - Custom SEO data yang sudah ada
   * @returns {Object} Generated SEO data
   */
  autoGenerateSeoData(model, modelType, customData = {}) {
    const config = this.defaultConfig[modelType] || this.defaultConfig.Article;
    
    // Generate title
    const generatedTitle = this.generateTitle(model, config, customData.seo_title);
    
    // Generate description
    const generatedDescription = this.generateDescription(model, config, customData.seo_description);
    
    // Generate keywords
    const generatedKeywords = this.generateKeywords(model, config, customData.seo_keywords);
    
    // Generate canonical URL
    const canonicalUrl = this.generateCanonicalUrl(model, modelType, customData.canonical_url);
    
    // Generate structured data
    const structuredData = this.generateAdvancedStructuredData(model, modelType, config);
    
    return {
      seo_title: generatedTitle,
      seo_description: generatedDescription,
      seo_keywords: generatedKeywords,
      canonical_url: canonicalUrl,
      meta_robots: customData.meta_robots || 'index,follow',
      schema_markup: structuredData,
      // Open Graph data
      open_graph_title: customData.open_graph_title || generatedTitle,
      open_graph_description: customData.open_graph_description || generatedDescription,
      open_graph_image: customData.open_graph_image || model.featured_image || model.image,
      // Twitter card data
      twitter_card: customData.twitter_card || 'summary_large_image',
      twitter_title: customData.twitter_title || generatedTitle,
      twitter_description: customData.twitter_description || generatedDescription,
      twitter_image: customData.twitter_image || model.featured_image || model.image
    };
  }

  /**
   * Generate optimized title
   */
  generateTitle(model, config, customTitle) {
    if (customTitle) {
      return this.optimizeTitle(customTitle, config.titleMaxLength);
    }

    let baseTitle = model.title || model.name || 'Untitled';
    
    // Untuk artikel, tambahkan context jika perlu
    if (model.category?.name && config.structuredDataType === 'Article') {
      baseTitle = `${baseTitle} - ${model.category.name}`;
    }
    
    // Apply template jika ada
    const finalTitle = config.titleTemplate ? config.titleTemplate(baseTitle) : baseTitle;
    
    return this.optimizeTitle(finalTitle, config.titleMaxLength);
  }

  /**
   * Generate optimized description
   */
  generateDescription(model, config, customDescription) {
    if (customDescription) {
      return this.optimizeDescription(customDescription, config.descriptionMaxLength);
    }

    let description = '';
    
    // Priority: excerpt > description > content > default
    if (model.excerpt) {
      description = model.excerpt;
    } else if (model.description) {
      description = model.description;
    } else if (model.content) {
      // Extract plain text dari content HTML
      description = this.extractTextFromHtml(model.content);
    } else {
      // Default description berdasarkan model type
      description = this.getDefaultDescription(model, config.structuredDataType);
    }
    
    return this.optimizeDescription(description, config.descriptionMaxLength);
  }

  /**
   * Generate keywords berdasarkan content analysis
   */
  generateKeywords(model, config, customKeywords) {
    if (customKeywords) {
      return this.optimizeKeywords(customKeywords, config.keywordsLimit);
    }

    const keywords = new Set();
    
    // Extract keywords dari title
    if (model.title) {
      this.extractKeywordsFromText(model.title).forEach(keyword => keywords.add(keyword));
    }
    
    // Extract keywords dari category
    if (model.category?.name) {
      keywords.add(model.category.name.toLowerCase());
    }
    
    // Extract keywords dari content (terbatas untuk performa)
    if (model.content) {
      const contentKeywords = this.extractKeywordsFromText(
        this.extractTextFromHtml(model.content).substring(0, 500)
      );
      contentKeywords.slice(0, 5).forEach(keyword => keywords.add(keyword));
    }
    
    // Medical-specific keywords untuk artikel kesehatan
    if (config.structuredDataType === 'Article' && model.category?.name) {
      const medicalKeywords = this.getMedicalKeywords(model.category.name);
      medicalKeywords.forEach(keyword => keywords.add(keyword));
    }
    
    return Array.from(keywords).slice(0, config.keywordsLimit).join(', ');
  }

  /**
   * Generate canonical URL
   */
  generateCanonicalUrl(model, modelType, customUrl) {
    if (customUrl) return customUrl;
    
    const baseUrl = process.env.BASE_URL || 'https://yoursite.com';
    
    switch (modelType) {
      case 'Article':
        return `${baseUrl}/articles/${model.slug}`;
      case 'Category':
        return `${baseUrl}/categories/${model.slug}`;
      case 'Doctor':
        return `${baseUrl}/doctors/${model.slug || model.id}`;
      default:
        return `${baseUrl}/${modelType.toLowerCase()}/${model.slug || model.id}`;
    }
  }

  /**
   * Generate advanced structured data
   */
  generateAdvancedStructuredData(model, modelType, config) {
    const baseUrl = process.env.BASE_URL || 'https://yoursite.com';
    const organizationName = process.env.ORGANIZATION_NAME || 'Medical Knowledge Hub';
    const organizationLogo = process.env.ORGANIZATION_LOGO || `${baseUrl}/logo.png`;
    
    switch (config.structuredDataType) {
      case 'Article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": model.title,
          "description": model.excerpt || this.extractTextFromHtml(model.content).substring(0, 160),
          "image": model.featured_image ? [model.featured_image] : undefined,
          "datePublished": model.published_at,
          "dateModified": model.updated_at,
          "author": {
            "@type": "Person",
            "name": model.author?.name || "Medical Expert",
            "url": model.author?.profile_url
          },
          "publisher": {
            "@type": "Organization",
            "name": organizationName,
            "logo": {
              "@type": "ImageObject",
              "url": organizationLogo
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": this.generateCanonicalUrl(model, modelType)
          },
          "articleSection": model.category?.name,
          "wordCount": model.content ? this.countWords(model.content) : undefined,
          "timeRequired": model.reading_time ? `PT${model.reading_time}M` : undefined,
          // Medical Article specific
          "about": model.category?.name ? {
            "@type": "Thing",
            "name": model.category.name
          } : undefined
        };

      case 'Person':
        return {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": model.name,
          "description": model.bio || model.description,
          "image": model.avatar || model.photo,
          "jobTitle": model.specialization || "Medical Professional",
          "worksFor": {
            "@type": "Organization",
            "name": organizationName
          },
          "url": this.generateCanonicalUrl(model, modelType),
          "sameAs": model.social_links ? Object.values(model.social_links) : undefined
        };

      case 'CollectionPage':
        return {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": model.name,
          "description": model.description,
          "url": this.generateCanonicalUrl(model, modelType),
          "mainEntity": {
            "@type": "ItemList",
            "name": `${model.name} Articles`,
            "description": `Collection of articles about ${model.name}`
          }
        };

      default:
        return {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": model.title || model.name,
          "description": model.excerpt || model.description,
          "url": this.generateCanonicalUrl(model, modelType)
        };
    }
  }

  /**
   * Upsert SEO meta dengan auto-generation
   */
  async upsertSeoMetaWithAutoGeneration(modelType, modelId, model, customSeoData = {}, options = {}) {
    try {
      const { transaction = null } = options;
      
      // Auto-generate SEO data
      const autoGeneratedData = this.autoGenerateSeoData(model, modelType, customSeoData);
      
      // Merge dengan custom data (custom data memiliki prioritas)
      const finalSeoData = {
        ...autoGeneratedData,
        ...this.cleanSeoData(customSeoData)
      };
      
      // Validasi data
      const validation = this.validateSeoData(finalSeoData);
      if (!validation.isValid) {
        logger.warn(`SEO validation warnings for ${modelType}:${modelId}`, validation.warnings);
      }
      
      const [seoMeta, created] = await SeoMeta.findOrCreate({
        where: {
          model_type: modelType,
          model_id: modelId
        },
        defaults: {
          ...finalSeoData,
          model_type: modelType,
          model_id: modelId
        },
        transaction
      });

      if (!created) {
        await seoMeta.update({
          ...finalSeoData,
          updated_at: new Date()
        }, { transaction });
      }

      logger.info(`SEO Meta ${created ? 'created' : 'updated'} for ${modelType}:${modelId}`);
      return {
        seoMeta,
        validation,
        autoGenerated: Object.keys(autoGeneratedData).filter(key => !customSeoData[key])
      };
    } catch (error) {
      logger.error(`Error upserting SEO meta for ${modelType}:${modelId}`, error);
      throw error;
    }
  }

  // Helper methods
  optimizeTitle(title, maxLength) {
    if (title.length <= maxLength) return title;
    
    // Truncate di kata terakhir yang muat
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > maxLength * 0.8 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  optimizeDescription(description, maxLength) {
    const plainText = this.extractTextFromHtml(description);
    if (plainText.length <= maxLength) return plainText;
    
    const truncated = plainText.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > maxLength * 0.8 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  optimizeKeywords(keywords, limit) {
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 2);
    return keywordArray.slice(0, limit).join(', ');
  }

  extractTextFromHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  extractKeywordsFromText(text) {
    if (!text) return [];
    
    // Simple keyword extraction - bisa diperbaiki dengan NLP library
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10);
  }

  isStopWord(word) {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'dari', 'dan', 'atau', 'tetapi', 'dalam', 'pada', 'untuk', 'dengan', 'oleh', 'yang'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  getMedicalKeywords(categoryName) {
    const medicalKeywordMap = {
      'cardiology': ['heart', 'cardiac', 'cardiovascular', 'blood pressure'],
      'neurology': ['brain', 'nervous system', 'neurological', 'mental health'],
      'pediatrics': ['children', 'kids', 'pediatric', 'child health'],
      'general': ['health', 'medical', 'healthcare', 'wellness'],
      // Tambahkan mapping lainnya sesuai kategori Anda
    };
    
    const normalizedCategory = categoryName.toLowerCase();
    return medicalKeywordMap[normalizedCategory] || medicalKeywordMap.general;
  }

  getDefaultDescription(model, structuredDataType) {
    switch (structuredDataType) {
      case 'Article':
        return `Read this comprehensive medical article about ${model.title}. Get expert insights and reliable health information.`;
      case 'Person':
        return `Learn about ${model.name}, a medical professional specializing in ${model.specialization || 'healthcare'}.`;
      case 'CollectionPage':
        return `Browse articles and resources in the ${model.name} category. Find reliable medical information and expert advice.`;
      default:
        return 'Find reliable medical information and expert healthcare advice.';
    }
  }

  countWords(text) {
    if (!text) return 0;
    return this.extractTextFromHtml(text).split(/\s+/).filter(word => word.length > 0).length;
  }

  cleanSeoData(seoData) {
    const validColumns = [
      'seo_title', 'seo_description', 'seo_keywords', 'canonical_url', 'meta_robots',
      'schema_markup', 'open_graph_title', 'open_graph_description', 'open_graph_image',
      'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image'
    ];
    
    const cleaned = {};
    Object.keys(seoData).forEach(key => {
      if (validColumns.includes(key) && 
          seoData[key] !== undefined && 
          seoData[key] !== null && 
          seoData[key] !== '') {
        cleaned[key] = seoData[key];
      }
    });
    
    return cleaned;
  }

  validateSeoData(seoData) {
    const errors = [];
    const warnings = [];

    if (seoData.seo_title) {
      if (seoData.seo_title.length > 60) {
        warnings.push('SEO title may be truncated in search results (>60 chars)');
      }
      if (seoData.seo_title.length < 30) {
        warnings.push('SEO title might be too short (<30 chars)');
      }
    }

    if (seoData.seo_description) {
      if (seoData.seo_description.length > 160) {
        warnings.push('SEO description may be truncated in search results (>160 chars)');
      }
      if (seoData.seo_description.length < 120) {
        warnings.push('SEO description might be too short (<120 chars)');
      }
    }

    if (seoData.canonical_url) {
      try {
        new URL(seoData.canonical_url);
      } catch {
        errors.push('Invalid canonical URL format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate complete SEO tags untuk frontend
   */
  generateCompleteSeoTags(model, seoMeta, request, modelType) {
    try {
      const baseUrl = `${request.protocol}://${request.get('host')}`;
      const config = this.defaultConfig[modelType] || this.defaultConfig.Article;
      
      // Jika tidak ada SEO meta, generate auto
      if (!seoMeta) {
        const autoGenerated = this.autoGenerateSeoData(model, modelType);
        seoMeta = autoGenerated;
      }
      
      return {
        title: seoMeta.seo_title,
        description: seoMeta.seo_description,
        keywords: seoMeta.seo_keywords,
        canonical: seoMeta.canonical_url,
        robots: seoMeta.meta_robots || 'index,follow',
        
        openGraph: {
          title: seoMeta.open_graph_title || seoMeta.seo_title,
          description: seoMeta.open_graph_description || seoMeta.seo_description,
          image: seoMeta.open_graph_image,
          url: seoMeta.canonical_url,
          type: config.ogType,
          siteName: process.env.SITE_NAME || 'Medical Knowledge Hub'
        },
        
        twitter: {
          card: seoMeta.twitter_card || 'summary_large_image',
          title: seoMeta.twitter_title || seoMeta.seo_title,
          description: seoMeta.twitter_description || seoMeta.seo_description,
          image: seoMeta.twitter_image || seoMeta.open_graph_image,
          site: process.env.TWITTER_SITE || '@yoursite'
        },
        
        structuredData: seoMeta.schema_markup
      };
    } catch (error) {
      logger.error('Error generating complete SEO tags:', error);
      // Return basic fallback
      return {
        title: model.title || 'Medical Knowledge Hub',
        description: model.excerpt || 'Reliable medical information and healthcare advice',
        canonical: `${request.protocol}://${request.get('host')}${request.originalUrl}`
      };
    }
  }
}

module.exports = new EnhancedSeoService();