# Deployment Guide - Xhenfy Captive Portal

This guide explains how to deploy the Xhenfy portal to production.

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
**Easiest deployment with built-in Next.js optimization**

#### Steps:
1. Create a [Vercel](https://vercel.com) account
2. Connect your Git repository
3. Set environment variables:
   - `NEON_DB_URL`: Your Neon database URL
4. Click "Deploy"

**Pros:** Zero configuration, automatic CI/CD, free tier available  
**Cons:** Requires GitHub/GitLab account

### Option 2: Netlify
**Good alternative with edge functions**

1. Push code to Git
2. Connect Netlify to your repo
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variable: `NEON_DB_URL`
6. Deploy

**Pros:** Easy setup, great documentation  
**Cons:** Less optimal Next.js support

### Option 3: Self-Hosted (VPS)
**Full control, but more setup required**

#### Prerequisites:
- Ubuntu 20.04+ or similar VPS
- Node.js 18+
- PostgreSQL database (or Neon)
- Nginx or Apache

#### Steps:

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Clone repository
git clone <your-repo-url>
cd xhenfy

# 3. Install dependencies
npm install

# 4. Set environment variables
echo "NEON_DB_URL=your-database-url" > .env.production.local

# 5. Setup database
npm run db:setup
npm run db:seed

# 6. Build
npm run build

# 7. Start with PM2 (recommended)
npm install -g pm2
pm2 start "npm start" --name "xhenfy"
pm2 save
pm2 startup

# 8. Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/xhenfy
```

**Nginx Config Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 4: Docker
**Container-based deployment**

#### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Build and Run:
```bash
docker build -t xhenfy .
docker run -p 3000:3000 \
  -e NEON_DB_URL="your-database-url" \
  xhenfy
```

## 🔒 Production Environment Variables

Create `.env.production`:
```env
NEON_DB_URL=postgresql://...
NODE_ENV=production
```

**Never commit secrets!** Use provider's secret management.

## 📊 Pre-Deployment Checklist

- [ ] Database is accessible from production server
- [ ] Environment variables are set correctly
- [ ] Database schema is created (`npm run db:setup`)
- [ ] Default data is seeded (`npm run db:seed`)
- [ ] Build completes without errors (`npm run build`)
- [ ] SSL/TLS certificate is installed
- [ ] Database backups are configured
- [ ] Monitoring is set up

## 🔄 CI/CD Setup

### GitHub Actions Example:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🔐 Security Checklist

### Before Going Live:

- [ ] Enable HTTPS/TLS
- [ ] Set secure headers (HSTS, CSP, etc.)
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Validate all inputs server-side
- [ ] Sanitize database queries
- [ ] Use secrets management (never expose credentials)
- [ ] Enable database encryption at rest
- [ ] Set up regular backups
- [ ] Monitor for suspicious activity

### Database Security:

```sql
-- Create read-only user for API
CREATE USER api_user WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE xhenfy TO api_user;
GRANT USAGE ON SCHEMA public TO api_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO api_user;
GRANT INSERT ON users, sessions, payments TO api_user;
GRANT UPDATE ON settings TO api_user;
```

## 📈 Performance Optimization

### Next.js Build:
- Image optimization enabled by default
- Automatic code splitting
- Serverless functions for API routes
- Static site generation where possible

### Database:
- Index commonly queried columns
- Use connection pooling (built-in with Neon)
- Monitor slow queries

### Caching:
```javascript
// Add cache headers in API routes
res.setHeader('Cache-Control', 'public, s-maxage=300');
```

## 🚨 Monitoring & Alerts

### Set up monitoring for:
- API response times
- Database performance
- Error rates
- Uptime

**Recommended Tools:**
- Vercel Analytics (if using Vercel)
- New Relic
- Datadog
- Sentry (error tracking)
- Uptimerobot (uptime monitoring)

## 🔄 Update Deployment

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Run database migrations if needed
npm run db:setup

# Rebuild
npm run build

# Restart server
pm2 restart xhenfy
```

## 🆘 Troubleshooting Deployment

### Portal loads but no plans show:
```bash
# SSH to server
npm run db:seed
```

### 500 errors on API calls:
- Check API logs
- Verify database connectivity
- Check environment variables

### Slow performance:
- Check database indexes
- Monitor server resources (CPU, RAM)
- Check API response times

## 📝 Maintenance

### Regular Tasks:
- Monitor error logs
- Review database backups
- Update dependencies monthly
- Check security vulnerabilities

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update
```

## 🎯 Scaling

For high traffic:
1. Use Neon's auto-scaling
2. Add caching layer (Redis)
3. Use CDN for static assets
4. Implement load balancing
5. Monitor and optimize database queries

## 📞 Support

- **Vercel Support:** https://vercel.com/support
- **Neon Support:** https://neon.tech/contact
- **Next.js Docs:** https://nextjs.org/docs/deployment

---

**Happy Deploying!** 🚀
