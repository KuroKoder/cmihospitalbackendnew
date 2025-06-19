const { Article } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Article.bulkCreate([
      {
        title: 'Understanding Diabetes',
        slug: 'understanding-diabetes',
        excerpt: 'A brief overview of diabetes and its management.',
        content: 'Diabetes is a chronic condition that occurs when...',
        featured_image: 'https://example.com/images/diabetes.jpg',
        authorId: 'valid-author-uuid', // Ganti dengan UUID pengguna yang valid
        categoryId: 'valid-category-uuid', // Ganti dengan UUID kategori yang valid
        status: 'published',
        is_featured: true,
        view_count: 100,
        reading_time: 5,
        published_at: new Date(),
        seo_title: 'Diabetes Management',
        seo_description: 'A comprehensive guide to managing diabetes.',
        seo_keywords: 'diabetes, health, management',
        meta_robots: 'index,follow',
        canonical_url: 'https://example.com/understanding-diabetes',
        schema_markup: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Healthy Eating Tips',
        slug: 'healthy-eating-tips',
        excerpt: 'Tips for maintaining a healthy diet.',
        content: 'Eating healthy is essential for maintaining...',
        featured_image: 'https://example.com/images/healthy-eating.jpg',
        authorId: 'valid-author-uuid', // Ganti dengan UUID pengguna yang valid
        categoryId: 'valid-category-uuid', // Ganti dengan UUID kategori yang valid
        status: 'published',
        is_featured: false,
        view_count: 50,
        reading_time: 3,
        published_at: new Date(),
        seo_title: 'Healthy Eating',
        seo_description: 'Learn how to eat healthy and stay fit.',
        seo_keywords: 'healthy eating, diet, nutrition',
        meta_robots: 'index,follow',
        canonical_url: 'https://example.com/healthy-eating-tips',
        schema_markup: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'The Importance of Regular Exercise',
        slug: 'importance-of-regular-exercise',
        excerpt: 'Why regular exercise is crucial for health.',
        content: 'Regular exercise is vital for maintaining...',
        featured_image: 'https://example.com/images/exercise.jpg',
        authorId: 'valid-author-uuid', // Ganti dengan UUID pengguna yang valid
        categoryId: 'valid-category-uuid', // Ganti dengan UUID kategori yang valid
        status: 'draft',
        is_featured: false,
        view_count: 0,
        reading_time: 4,
        published_at: null,
        seo_title: 'Regular Exercise',
        seo_description: 'Discover the benefits of regular exercise.',
        seo_keywords: 'exercise, fitness, health',
        meta_robots: 'index,follow',
        canonical_url: 'https://example.com/importance-of-regular-exercise',
        schema_markup: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Tambahkan lebih banyak artikel sesuai kebutuhan
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Article.destroy({ where: {}, truncate: true });
  }
};
