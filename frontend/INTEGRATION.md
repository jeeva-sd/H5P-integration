# Frontend Integration with Backend API

## ✅ Updated for Backend API v2.0

This frontend has been updated to work with the new backend that matches the official H5P REST API specification.

## 🔄 Key Changes Made

### 1. **Created ContentService** (`src/services/ContentService.ts`)
   - Centralized API communication
   - Matches official H5P REST API format
   - Proper error handling

### 2. **Updated HomePage** (`src/pages/HomePage.tsx`)
   - Uses ContentService for all API calls
   - Handles array response directly (not wrapped in `{ content: [] }`)
   - Better error handling and retry logic

### 3. **Updated EditorPage** (`src/pages/EditorPage.tsx`)
   - Uses `PATCH` method for updates (instead of `PUT`)
   - Handles `{ contentId, metadata }` response format
   - Proper integration with `@lumieducation/h5p-react`

### 4. **Updated PlayerPage** (`src/pages/PlayerPage.tsx`)
   - Uses ContentService for loading player content
   - Better error handling

## 📋 API Response Formats

### List Content
**Endpoint:** `GET /api/content`

**Response:**
```json
[
  {
    "contentId": "123456789",
    "title": "My Content",
    "mainLibrary": "H5P.GreetingCard"
  }
]
```

### Get Editor
**Endpoint:** `GET /api/content/:contentId/edit`

**Response (New Content):**
```json
{
  "integration": {...},
  "scripts": [...],
  "styles": [...]
}
```

**Response (Existing Content):**
```json
{
  "integration": {...},
  "scripts": [...],
  "styles": [...],
  "library": "H5P.GreetingCard 1.0",
  "metadata": {...},
  "params": {...}
}
```

### Save Content
**Endpoint:** `POST /api/content` (create) or `PATCH /api/content/:contentId` (update)

**Request:**
```json
{
  "library": "H5P.GreetingCard 1.0",
  "params": {
    "params": {
      "greeting": "Hello World"
    },
    "metadata": {
      "title": "My Greeting Card",
      "license": "U",
      "authors": [],
      "changes": []
    }
  }
}
```

**Response:**
```json
{
  "contentId": "123456789",
  "metadata": {
    "title": "My Greeting Card",
    "mainLibrary": "H5P.GreetingCard",
    ...
  }
}
```

### Delete Content
**Endpoint:** `DELETE /api/content/:contentId`

**Response:**
```
"Content 123456789 successfully deleted."
```

## 🚀 Running the Frontend

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure backend URL (optional):**
   ```bash
   cp .env.example .env.local
   # Edit .env.local to set VITE_API_URL if needed
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## ✅ Backend Compatibility Checklist

- ✅ Uses official H5P REST API format
- ✅ Handles array responses correctly
- ✅ Uses PATCH for updates (not PUT)
- ✅ Proper error handling
- ✅ Type-safe with TypeScript
- ✅ Works with `@lumieducation/h5p-react`

## 🔗 Related Files

- **Backend API**: `../backend/routes/content.js`
- **Backend Config**: `../backend/config/h5p.js`
- **Backend Tests**: `../backend/test-api.js`
- **Official Example**: `../h5p-rest-example-server/src/routes.ts`
