CREATE TABLE seo_meta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_path VARCHAR(500) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,
    keywords TEXT,
    robots VARCHAR(100) DEFAULT 'index,follow',
    canonical_url TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image TEXT,
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image TEXT,
    schema_markup JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_meta_url ON seo_meta(url_path);