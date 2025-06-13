CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS diagrams (
    id UUID PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    visibility TEXT DEFAULT 'private',
    database_type TEXT,
    database_edition TEXT,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_tables (
    id UUID PRIMARY KEY,
    diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
    data JSONB
);

CREATE TABLE IF NOT EXISTS db_relationships (
    id UUID PRIMARY KEY,
    diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
    data JSONB
);

CREATE TABLE IF NOT EXISTS db_dependencies (
    id UUID PRIMARY KEY,
    diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
    data JSONB
);

CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY,
    diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
    data JSONB
);

CREATE TABLE IF NOT EXISTS db_custom_types (
    id UUID PRIMARY KEY,
    diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
    data JSONB
);
