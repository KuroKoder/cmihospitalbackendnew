CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    meta_robots VARCHAR(100) DEFAULT 'index,follow',
    canonical_url TEXT,
    schema_markup JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_published ON articles(published_at);
CREATE INDEX idx_articles_featured ON articles(is_featured);
CREATE INDEX idx_articles_views ON articles(view_count);

-- Full text search
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || excerpt || ' ' || content));