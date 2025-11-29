# Embed Service Integration

This document shows how to integrate the local embed service (nesternity-ai/embed_service) into the main Nesternity app.

1) Run embed service locally (from `nesternity-ai/embed_service`):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8081
```

2) Set environment variables in the main Nesternity app project:

Add to `.env.local` (root):

```
EMBED_SERVICE_URL=http://localhost:8081
AI_PROVIDER=local  # Default provider set to 'local' - we will use the in-house model only
AI_RAG_ENABLED=true
AI_MODEL_ENDPOINT=http://localhost:8080  # required for generation if using a local generator (TGI)
AI_MODEL=local-model
```

3) If you want to only use embeddings from the local service but keep Gemini for generation:

```
EMBED_SERVICE_URL=http://localhost:8081
AI_PROVIDER=gemini
AI_RAG_ENABLED=true
```

4) If using local generation (TGI or other), you must deploy a model server with `/generate` and `/embed` endpoints. The `LocalProvider` expects `AI_MODEL_ENDPOINT` to be the base URL.

5) Index docs for RAG:

- Run the DB migration (`prisma migrate deploy`) or apply the SQL script to create `documents` table and `vector(384)` column.
- Run the indexing script to index proposals:

```
pnpm run index:documents
```

6) Test:

- Ensure embed service is running and Next app `EMBED_SERVICE_URL` is set; call any AI endpoints (proposal/generate or scope-sentinel) to confirm the retrieval and generation pipeline works.


Notes:
- The Local provider requires a generation endpoint; without that, `AI_PROVIDER=local` will still attempt to call the local generator for `generateCompletion`.
- You can set `AI_RAG_ENABLED=false` to disable retrieval and use the provider only for generation.

If you want, I can also add automatic background tasks to index new proposals/invoices into `documents` on create/update events.
