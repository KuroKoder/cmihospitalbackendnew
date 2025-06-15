# cmihospitalbackendnew
```
cmihospitalbackendnew
├─ .sequelizerc
├─ package.json
├─ README.md
├─ scripts
│  ├─ initial_data.sql
│  └─ migrate.js
├─ server.js
└─ src
   ├─ app.js
   ├─ config
   │  ├─ config.js
   │  ├─ index.js
   │  ├─ redis.js
   │  └─ sequalize.js
   ├─ controllers
   │  ├─ articleController.js
   │  ├─ authController.js
   │  ├─ categoryController.js
   │  ├─ doctorController.js
   │  ├─ pageController.js
   │  └─ seoController.js
   ├─ middleware
   │  ├─ auth.js
   │  ├─ cache.js
   │  ├─ errorHandler.js
   │  ├─ rateLimit.js
   │  └─ validation.js
   ├─ migrations
   │  ├─ 001_create_users_table.sql
   │  ├─ 002_create_categories_table.sql
   │  ├─ 003_create_articles_table.sql
   │  ├─ 004_create_doctors_table.sql
   │  ├─ 005_create_pages_table.sql
   │  └─ 006_create_seo_meta_table.sql
   ├─ models
   │  ├─ Article.js
   │  ├─ Category.js
   │  ├─ Doctor.js
   │  ├─ index.js
   │  ├─ Page.js
   │  └─ User.js
   ├─ routes
   │  ├─ api
   │  │  ├─ article.js
   │  │  ├─ auth.js
   │  │  ├─ categories.js
   │  │  ├─ doctors.js
   │  │  ├─ pages.js
   │  │  └─ seo.js
   │  └─ index.js
   ├─ seeders
   ├─ services
   │  ├─ emailService.js
   │  ├─ seoService.js
   │  └─ uploadService.js
   ├─ utils
   │  ├─ constants.js
   │  ├─ helpers.js
   │  └─ logger.js
   └─ validators
      ├─ articleValidator.js
      ├─ authValidator.js
      └─ commonValidator.js

```