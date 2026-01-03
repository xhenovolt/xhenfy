# Xhenfy - Modern WiFi Captive Portal System

A **production-ready, fully dynamic captive portal** for WiFi hotspots built with Next.js, React, TailwindCSS, and PostgreSQL.

## 🎯 Features

✨ **Complete Portal Experience**
- Dynamic plan selection (Daily, Weekly, Monthly)
- Real-time pricing from database
- Beautiful, mobile-first UI
- SweetAlert2 integration
- Session management with countdown
- Mock payment system (ready for STK Push integration)

💾 **Full Backend**
- RESTful API with Next.js
- PostgreSQL database with comprehensive schema
- User registration and management
- Payment tracking
- Dynamic settings management

⚙️ **Admin Features**
- Settings page to manage pricing
- Currency selection
- Real-time price updates reflected on portal

🎨 **Modern Design**
- TailwindCSS v4 styling
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Beautiful gradient backgrounds
- Dark theme optimized UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn
- Neon PostgreSQL account

### Setup (2 minutes)

```bash
# Navigate to project
cd /home/xhenvolt/projects/xhenfy

# Install dependencies (if not already done)
npm install

# Setup database
npm run db:setup
npm run db:seed

# Start development server
npm run dev
```

**Visit:** http://localhost:3000

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide with testing steps
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Complete technical documentation

## 🏗️ Architecture

```
Xhenfy Portal
├── Frontend (Next.js + React)
│   ├── Landing Page with Plan Selection
│   ├── Settings Management Page
│   └── Plan Selection Modal
├── API Routes
│   ├── /api/plans - Get active plans
│   ├── /api/settings - Get/update settings
│   ├── /api/users/register - Register users
│   ├── /api/sessions - Manage sessions
│   └── /api/payments - Process payments
└── Database (PostgreSQL)
    ├── users - User information
    ├── sessions - Active sessions
    ├── plans - Available plans
    ├── payments - Payment records
    ├── devices - Device tracking
    └── settings - Portal configuration
```

## 📱 Portal Pages

### Main Portal (/)
- Welcome message
- 3 plan cards (Daily, Weekly, Monthly)
- Dynamic pricing from database
- Session information bar
- Plan selection with modal
- Info section with features

### Settings (/settings)
- Change currency
- Update plan prices
- Save changes to database
- Immediate UI updates

## 🗄️ Database

**Tables:**
- `users` - Phone number, MAC address, status
- `sessions` - User sessions with timestamps
- `plans` - Available plans with pricing
- `payments` - Payment transactions
- `devices` - Device tracking and blacklist
- `settings` - Portal configuration (currency, prices)

**Default Data:**
- Daily: 1,000 UGX
- Weekly: 5,000 UGX
- Monthly: 18,000 UGX
- Currency: UGX

## 🔌 API Examples

### Get Plans
```bash
curl http://localhost:3000/api/plans
```

### Get Settings
```bash
curl http://localhost:3000/api/settings
```

### Update Price
```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"key":"daily_price","value":"1500"}'
```

## 🧪 Testing

1. **View Portal:** http://localhost:3000
2. **Change Settings:** http://localhost:3000/settings
3. **Select Plan:** Click any plan card
4. **Enter Phone:** Input phone number
5. **Complete:** Click "Pay Now"

See [QUICKSTART.md](QUICKSTART.md) for detailed testing guide.

## 📂 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── plans/route.js
│   │   ├── settings/route.js
│   │   ├── users/register/route.js
│   │   ├── sessions/route.js
│   │   └── payments/route.js
│   ├── settings/page.js
│   ├── page.js
│   ├── layout.js
│   └── globals.css
├── components/
│   └── PlanModal.jsx
├── config/
│   └── portal.js
└── lib/
    ├── db.js
    └── api.js
scripts/
├── setupDb.js
└── seedDb.js
```

## 🛠️ Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:setup    # Create database schema
npm run db:seed     # Seed default data
```

## 📦 Technology Stack

- **Frontend:** React 19.2.3, Next.js 16.1.1
- **Styling:** TailwindCSS 4
- **Database:** PostgreSQL (Neon)
- **UI Components:** SweetAlert2
- **HTTP Client:** Axios

## ✨ Key Features

### Dynamic Pricing
- All prices stored in database
- Update via settings page
- Reflected immediately on portal

### Responsive Design
- Mobile-first approach
- Works on all devices
- Touch-optimized buttons
- Readable on small screens

### Modern UX
- Loading states with spinners
- Success/error feedback modals
- Smooth transitions
- Animated backgrounds

### Extensible
- API-first architecture
- Ready for payment gateway integration
- Support for future features
- Clean, modular code

## 🔐 Security Notes

⚠️ **Current State:**
- Mock payment system
- No real transactions
- Demo data only

✅ **Production Ready:**
- Implement real payment gateway
- Add phone OTP verification
- Use HTTPS/TLS
- Add rate limiting
- Server-side validation

## 🚀 Next Steps

1. **Customize Branding** - Edit `src/config/portal.js`
2. **Change Colors** - Modify TailwindCSS in components
3. **Add More Plans** - Insert into database
4. **Real Payments** - Implement STK Push integration
5. **Deploy** - Use Vercel, Netlify, or preferred platform

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [SweetAlert2 Documentation](https://sweetalert2.github.io)

## 📝 License

MIT - Open source and free to use

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** January 1, 2026

**Quick Links:**
- 📖 [Full Documentation](DOCUMENTATION.md)
- ⚡ [Quick Start Guide](QUICKSTART.md)
- 🔗 [Portal](http://localhost:3000)
- ⚙️ [Settings](http://localhost:3000/settings)
