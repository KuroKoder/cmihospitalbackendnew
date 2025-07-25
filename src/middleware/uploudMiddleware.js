// src/middleware/uploadMiddleware.js - Enhanced version
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp'); // For image processing

// Ensure upload directories exist (async version)
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Enhanced storage configuration
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let uploadPath;
    
    // Organize by date for better file management
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    if (file.fieldname === 'featured_image') {
      uploadPath = path.join(process.cwd(), 'uploads', 'articles', 'featured', year.toString(), month);
    } else if (file.fieldname === 'content_images') {
      uploadPath = path.join(process.cwd(), 'uploads', 'articles', 'content', year.toString(), month);
    } else {
      uploadPath = path.join(process.cwd(), 'uploads', 'articles', 'misc', year.toString(), month);
    }
    
    try {
      await ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate secure filename with hash
    const hash = crypto.createHash('md5').update(file.originalname + Date.now()).digest('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20); // Limit name length
    
    cb(null, `${name}-${hash}${ext}`);
  }
});

// Enhanced file filter with MIME type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  };
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  
  if (allowedTypes[mimeType] && allowedTypes[mimeType].includes(ext)) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${Object.keys(allowedTypes).join(', ')}`));
  }
};

// Enhanced multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
    fields: 20, // Maximum 20 fields
    parts: 30 // Maximum 30 parts
  },
  fileFilter: fileFilter
});

// Upload configurations for different scenarios
const uploadConfigs = {
  // Single featured image
  featuredImage: upload.single('featured_image'),
  
  // Multiple content images
  contentImages: upload.array('content_images', 10),
  
  // Mixed upload (featured + content images)
  mixed: upload.fields([
    { name: 'featured_image', maxCount: 1 },
    { name: 'content_images', maxCount: 10 }
  ]),
  
  // Single image (generic)
  singleImage: upload.single('image'),
  
  // Any image field
  anyImage: upload.any()
};

// Image processing middleware (optional)
const processImages = async (req, res, next) => {
  try {
    if (req.files) {
      const processFile = async (file) => {
        const outputPath = file.path.replace(/\.[^/.]+$/, '-optimized.webp');
        
        await sharp(file.path)
          .resize(1200, 1200, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .webp({ quality: 85 })
          .toFile(outputPath);
        
        // Update file info
        file.optimizedPath = outputPath;
        file.optimizedSize = (await fs.stat(outputPath)).size;
      };
      
      // Process featured image
      if (req.files.featured_image) {
        await processFile(req.files.featured_image[0]);
      }
      
      // Process content images
      if (req.files.content_images) {
        await Promise.all(req.files.content_images.map(processFile));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Enhanced helper function to get file URL
const getFileUrl = (filePath, req) => {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${relativePath}`;
};

// Enhanced file deletion with error handling
const deleteFile = async (filePath) => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Cleanup old files (utility function)
const cleanupOldFiles = async (directory, maxAgeInDays = 30) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        console.log(`Deleted old file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};

// File validation utility
const validateImageFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return errors;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size exceeds 5MB limit');
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Invalid file type');
  }
  
  return errors;
};

module.exports = {
  uploadConfigs,
  processImages,
  ensureDirectoryExists,
  getFileUrl,
  deleteFile,
  cleanupOldFiles,
  validateImageFile
};