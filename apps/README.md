## Hackathon Server

```bash
git clone https://github.com/wrtnlabs/autobe
cd autobe
pnpm install


docker run -d \
  --name autobe-postgres \
  -e POSTGRES_USER=autobe \
  -e POSTGRES_PASSWORD=autobe \
  -e POSTGRES_DB=autobe \
  -p 5432:5432 \
  postgres:16

cd apps/hackathon-server
pnpm run build
pnpm run schema
pnpm start

```