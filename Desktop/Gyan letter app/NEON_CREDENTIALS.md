# Neon Database Credentials

## Connection String
```
postgresql://neondb_owner:npg_1c6KUGfSRJvw@ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Extracted Credentials for Vercel

Add these as Environment Variables in Vercel:

```
DB_HOST=ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=npg_1c6KUGfSRJvw
DB_NAME=neondb
DB_PORT=5432
NODE_ENV=production
PORT=5000
```

## Testing Connection

You can test the connection using:
```bash
psql 'postgresql://neondb_owner:npg_1c6KUGfSRJvw@ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
```














