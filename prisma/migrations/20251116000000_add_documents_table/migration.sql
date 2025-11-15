-- Create documents table with embedding vector column using pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  namespace TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  embedding vector(384),
  created_at timestamptz DEFAULT now()
);

-- Optional index (using ivfflat for larger deployments)
-- CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
