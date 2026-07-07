# EuroWeekender Frontend

React + Vite web app for **[euroweekender.com](https://euroweekender.com)**.

## Development

```bash
npm install
npm run dev
```

The dev server proxies API requests to `http://localhost:5001`.

## Production build

```bash
npm run build
```

Static assets are served from `dist/` (Docker/nginx in `flight-search/docker-compose.yml`).
