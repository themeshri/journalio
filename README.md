# ChainJournal

**Professional Crypto Trading Journal & Analytics Platform**

A comprehensive trading journal built for serious cryptocurrency traders who want to learn from their trades, track performance, and improve their decision-making through detailed analysis and multimedia journaling.

## 🚀 Live Demo

**Current Status: Phase 2 (75% Complete) - Advanced Journaling System**

### ✅ **Working Features:**

- **📊 Trade Management**: View, edit, and manage your trading history
- **🎙️ Voice Journaling**: Record voice notes directly in your browser
- **📁 File Uploads**: Drag-and-drop screenshots and documents
- **⭐ Rating System**: Rate your trades from 1-5 stars with descriptive labels
- **🏷️ Tag Management**: Organize trades with custom tags
- **🔍 Advanced Search**: Filter by text, tags, ratings, and more
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🎯 Mistake Tracking**: Track and learn from trading errors

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+ with App Router, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Authentication**: Clerk (bypassed in development)
- **Database**: PostgreSQL with Prisma ORM (mock data for demo)
- **Storage**: Supabase (mock implementation for demo)
- **Charts**: Recharts for analytics visualization

## 🏁 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/journalio.git
   cd journalio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   The app is configured to run in development mode with authentication bypassed.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Explore Example Trades
- Visit `/dashboard/trades` to see 10 realistic Solana trading examples
- Trades include popular tokens like BONK, WIF, JTO, PYTH, RENDER, and more

### Try Advanced Journaling
1. Click on any trade to edit it (`/dashboard/trades/edit/1`)
2. Scroll down to the "Trade Journal" section
3. Click "New Entry" to create a journal entry
4. Test the voice recording feature (requires microphone permission)
5. Upload screenshots or charts using drag-and-drop
6. Add ratings and custom tags

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- Authentication system
- Basic trade management
- Dashboard analytics

### Phase 2: Advanced Journaling (75% Complete) 🔄
- ✅ Voice recording and playback
- ✅ File upload system
- ✅ Multimedia journal entries
- ✅ Mistake tracking
- ❌ Real database persistence
- ❌ Position tracking (FIFO)
- ❌ Real P&L calculations

### Phase 3: Advanced Features 📅
- Daily journaling workflows
- Missed trade tracking
- Strategy management
- Subscription system

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── trades/         # Trade-specific components
│   └── journaling/     # Journal entry components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── styles/             # Global styles and Tailwind config
```

## 🎯 Key Features

### Advanced Journaling System
- **Voice Notes**: Record your thought process while trading
- **File Attachments**: Upload charts, screenshots, and analysis
- **Rich Text**: Full markdown support for detailed notes
- **Search & Filter**: Find entries by content, tags, or ratings

### Trade Management
- **Manual Entry**: Add trades manually with full validation
- **Editing**: Comprehensive trade editing with audit trails
- **Example Data**: 10+ realistic Solana trades for testing

### Professional UI
- **Modern Design**: Clean, responsive interface built with Shadcn/ui
- **Dark Mode Ready**: Professional trading interface
- **Mobile Optimized**: Works seamlessly on all devices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Example data inspired by real Solana trading patterns

---

**ChainJournal** - *Because every trade has a story* 📚# journalio
