const { Op } = require('sequelize');

/**
 * Generate unique slug from name
 * @param {string} name - The name to convert to slug
 * @param {Object} model - Sequelize model to check uniqueness
 * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} - Unique slug
 */
const generateSlug = async (name, model, excludeId = null) => {
  if (!name) {
    throw new Error('Name is required for slug generation');
  }

  // Convert to slug format
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  if (!baseSlug) {
    baseSlug = 'slug';
  }

  let slug = baseSlug;
  let counter = 1;

  // Check for uniqueness
  while (true) {
    const whereClause = { slug };
    
    // Exclude current record if updating
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existing = await model.findOne({ where: whereClause });
    
    if (!existing) {
      break;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Sanitize HTML content (basic sanitization)
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '');
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination metadata
 */
const generatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalItems = parseInt(total) || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  };
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'iso')
 * @returns {string} - Formatted date
 */
const formatDate = (date, format = 'short') => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  switch (format) {
    case 'iso':
      return d.toISOString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
};

/**
 * Generate SEO-friendly excerpt from content
 * @param {string} content - Content to excerpt
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} - Excerpt
 */
const generateExcerpt = (content, maxLength = 160) => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove HTML tags
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  const cleanText = textContent.replace(/\s+/g, ' ').trim();

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // Cut at word boundary
  const excerpt = cleanText.substring(0, maxLength);
  const lastSpace = excerpt.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return excerpt.substring(0, lastSpace) + '...';
  }
  
  return excerpt + '...';
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Generate random string
 * @param {number} length - Length of random string
 * @param {string} charset - Character set to use
 * @returns {string} - Random string
 */
const generateRandomString = (length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Bytes to convert
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Human readable size
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
/**
 * Estimate reading time based on word count
 * @param {string} content - Text content
 * @param {number} wordsPerMinute - Optional WPM rate
 * @returns {number} - Estimated reading time in minutes
 */
const calculateReadingTime = (content, wordsPerMinute = 200) => {
  if (!content || typeof content !== 'string') return 0;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

module.exports = {
  generateSlug,
  sanitizeHtml,
  generatePagination,
  formatDate,
  generateExcerpt,
  isValidUUID,
  generateRandomString,
  formatBytes,
  debounce,
  calculateReadingTime
};