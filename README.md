# QubuR

## Architecture (no Supabase)
- Frontend: Vite + React
- Backend: Fastify + tRPC (`/trpc`) + REST upload/download (`/api/*`)
- Database: PostgreSQL (app data + file metadata only)
- File storage: Disk (default) or S3-compatible

## Local (Docker)
- Start: `npm run docker:up`
- Logs: `npm run docker:logs:backend`
- DB shell: `npm run docker:psql`

## File uploads
- Upload: `POST /api/upload/:bucket` (multipart `file`)
- Fetch: `GET /api/file/:bucket/:filename`
- Stored metadata table: `storedfile` (created via TypeORM sync or migration)

## Storage config
- Disk (default): `STORAGE_DRIVER=disk`, `STORAGE_DISK_ROOT=/usr/src/app/storage_data`
- S3: set `STORAGE_DRIVER=s3` and provide `S3_BUCKET`, `S3_REGION` (+ creds / endpoint if needed)
