# Quick Start Guide - Xhenfy Captive Portal

## 🎯 5-Minute Setup

### Step 1: Environment
The `.env.local` file is already configured with your Neon database URL:
```
NEON_DB_URL=postgresql://neondb_owner:npg_HExwNUY6aVP9@ep-small-sound-adgn2dmu-pooler.c-2.us-east-1.aws.neon.tech/xhenfy?sslmode=require&channel_binding=require
```

### Step 2: Dependencies
All dependencies are installed. To verify:
```bash
npm list
```

### Step 3: Database
Database is already set up and seeded with:
- ✅ Tables created
- ✅ Default plans (Daily: 1000 UGX, Weekly: 5000 UGX, Monthly: 18000 UGX)
- ✅ Settings initialized

### Step 4: Start Server
The development server is running at **http://localhost:3000**

If it's stopped, restart it:
```bash
npm run dev
```

---

## 🧪 Test the Portal

### Test 1: View Portal
1. Open http://localhost:3000 in your browser
2. You should see 3 plan cards (Daily, Weekly, Monthly)
3. Plans display pricing from the database

✅ **Expected:** Plans load with prices from database

### Test 2: Update Pricing
1. Go to http://localhost:3000/settings
2. Change Daily price to 1200 UGX
3. Click "Save Settings"
4. Return to http://localhost:3000

✅ **Expected:** Price updates on cards automatically

### Test 3: Plan Selection
1. Click on any plan card (e.g., Daily)
2. Enter a phone number (e.g., 7XXXXXXXX)
3. Click "Pay Now"

✅ **Expected:** Success modal appears with transaction details

### Test 4: Session Info
1. On the main portal page, check the top info bar
2. Should display:
   - Session Expiry (countdown timer)
   - MAC Address
   - IP Address
   - Current Currency

✅ **Expected:** All information displays and timer counts down

---

## 📊 Verify Database

Check what's in the database:

### View Plans
```bash
psql "postgresql://neondb_owner:npg_HExwNUY6aVP9@ep-small-sound-adgn2dmu-pooler.c-2.us-east-1.aws.neon.tech/xhenfy?sslmode=require"
SELECT * FROM plans;
SELECT * FROM settings;
SELECT * FROM users;
SELECT * FROM sessions;
SELECT * FROM payments;
```

---

## 🔧 Common Tasks

### Change Default Currency
1. Go to Settings page
2. Change currency from "UGX" to another (e.g., "USD")
3. Save
4. Go back to portal - currency updates everywhere

### Update Plan Prices
1. Go to Settings
2. Modify Daily, Weekly, or Monthly prices
3. Save
4. Portal immediately reflects new prices

### Reset Database
```bash
# Clear all data
npm run db:seed  # Reinserts default data
```

### Rebuild Database
```bash
npm run db:setup  # Recreates schema
npm run db:seed   # Adds default data
```

---

## 🌐 API Testing

Test API endpoints directly:

### Get Plans
```bash
curl http://localhost:3000/api/plans
```

### Get Settings
```bash
curl http://localhost:3000/api/settings
```

### Update Setting
```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"key":"default_currency","value":"USD"}'
```

### Register User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"256701234567","mac_address":"AA:BB:CC:DD:EE:FF"}'
```

---

## 📱 Mobile Testing

The portal is mobile-responsive. Test on:

1. **Desktop:** Full 3-column grid
2. **Tablet:** 2-column grid  
3. **Mobile:** Single column with touch optimization

Use browser DevTools (F12) → Device Toolbar to test responsive design.

---

## 🐛 Troubleshooting

### Portal shows "Loading..." forever
- Check browser console for errors (F12)
- Verify dev server is running: `npm run dev`
- Check if API endpoints respond: `curl http://localhost:3000/api/plans`

### Plans not showing prices
- Ensure database is seeded: `npm run db:seed`
- Check if /api/plans returns data
- Verify browser network tab for API response

### Settings not saving
- Check browser console for errors
- Verify database connection
- Try clearing browser cache and refreshing

### Styles look wrong
- Restart dev server: `npm run dev`
- Clear browser cache
- Verify TailwindCSS is running

---

## 📂 File Locations

| File | Purpose |
|------|---------|
| `src/app/page.js` | Main portal page |
| `src/app/settings/page.js` | Settings management |
| `src/components/PlanModal.jsx` | Plan selection modal |
| `src/app/api/plans/route.js` | Plans API |
| `src/app/api/settings/route.js` | Settings API |
| `.env.local` | Database credentials |
| `scripts/setupDb.js` | Database schema |
| `scripts/seedDb.js` | Default data |

---

## ✅ Checklist

- [x] Database connected
- [x] Tables created
- [x] Default data seeded
- [x] Dev server running
- [x] Portal loads
- [x] Plans display
- [x] Settings work
- [x] Pricing updates dynamically
- [x] Mobile responsive
- [x] Modal working

---

## 🚀 Next Steps

1. **Customize Branding:** Edit `src/config/portal.js`
2. **Change Colors:** Modify TailwindCSS classes in components
3. **Add More Plans:** Insert into database
4. **Implement Real Payments:** Replace mock payment in `src/app/api/payments/route.js`
5. **Deploy:** Use Vercel, Netlify, or your hosting platform

---

## 📞 Support

- **API Documentation:** See `DOCUMENTATION.md`
- **Database Schema:** See `DOCUMENTATION.md` > Database Schema
- **Component Files:** Check `src/components/` directory
- **Routes:** Check `src/app/api/` directory

---

**Portal Status:** ✅ Ready for Use  
**Last Verified:** January 1, 2026
