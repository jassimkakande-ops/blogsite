# Reelpexi Integration Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     http://localhost:4577                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    PAGES / ROUTES                         │  │
│  │  - app/page.tsx (Home)                                    │  │
│  │  - app/movies/page.tsx                                    │  │
│  │  - app/series/page.tsx                                    │  │
│  │  - app/search/page.tsx                                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                API WRAPPER LAYER                          │  │
│  │              lib/api.ts                                   │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  getMovies()      →  ReelplexiService.getMovies()  │  │  │
│  │  │  getSeries()      →  ReelplexiService.getSeries()  │  │  │
│  │  │  getVJContent()   →  ReelplexiService + filtering  │  │  │
│  │  │  searchMovies()   →  ReelplexiService + filter     │  │  │
│  │  │  getGenres()      →  ReelplexiService.getGenres()  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              REELPEXI SERVICE LAYER                       │  │
│  │          lib/reelplexi-service.ts                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  • Data fetching from Reelpexi API                 │  │  │
│  │  │  • Response normalization                          │  │  │
│  │  │  • Error handling                                  │  │  │
│  │  │  • VJ extraction                                   │  │  │
│  │  │  • Genre mapping                                   │  │  │
│  │  │  • Stream URL generation                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CONFIGURATION LAYER                          │  │
│  │          lib/reelplexi-config.ts                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  • API Key management                              │  │  │
│  │  │  • Base URL configuration                          │  │  │
│  │  │  • Configuration validation                        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │   Environment Variables       │
         │       .env.local              │
         │  ┌────────────────────────┐  │
         │  │ REELPLEXI_API_KEY      │  │
         │  │ REELPLEXI_BASE_URL     │  │
         │  └────────────────────────┘  │
         └───────────────┬──────────────┘
                         │
                         ▼
         ┌──────────────────────────────┐
         │      REELPEXI API            │
         │  https://api.reelplexi.com   │
         │  ┌────────────────────────┐  │
         │  │ /v1/movies             │  │
         │  │ /v1/series             │  │
         │  │ /v1/genres             │  │
         │  │ /v1/trending/*         │  │
         │  │ /v1/stream/*           │  │
         │  └────────────────────────┘  │
         └──────────────────────────────┘
```

## 📊 Key Components

### 1. Reelpexi Service (lib/reelplexi-service.ts)
- Main API integration layer
- 500+ lines of code
- 15+ API endpoints
- Data normalization
- Error handling

### 2. API Wrapper (lib/api.ts)
- Backward compatibility
- Existing function signatures maintained
- Type safety
- Easy migration path

### 3. Configuration (lib/reelplexi-config.ts)
- Environment variable management
- API key validation
- Base URL configuration

## 🔄 Data Flow

```
User Request → Page Component → API Wrapper → Reelplexi Service → API → Cache → Display
```

## ✅ Implementation Complete

All movie/series content now retrieved from Reelpexi API!
