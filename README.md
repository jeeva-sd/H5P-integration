# My H5P Application ��

A simple React + Express application for creating, viewing, and managing H5P interactive content.

## 📋 Features

- **3 Main Pages:**
  - **List Page** - View all your H5P content
  - **Create Page** - Create new interactive content
  - **View Page** - Play/view H5P content

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + H5P Libraries
- **Ports:**
  - Frontend: http://localhost:3000
  - Backend: http://localhost:3001

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 7.0.0

### Installation & Setup

1. **Install Backend Dependencies:**
```bash
cd backend
npm install
```

2. **Install Frontend Dependencies:**
```bash
cd ../frontend
npm install
```

### Running the Application

**Option 1: Manual (2 terminals)**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Option 2: Using the start script**
```bash
npm start
```

Then open your browser to **http://localhost:3000**

## 📁 Project Structure

```
my-h5p-app/
├── backend/
│   ├── server.js              # Express server with H5P integration
│   ├── config/
│   │   └── h5p-config.json   # H5P configuration
│   ├── h5p/
│   │   ├── core/             # H5P core files
│   │   ├── editor/           # H5P editor files
│   │   ├── libraries/        # H5P libraries
│   │   ├── content/          # Stored content
│   │   └── temporary-storage/ # Temp files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app with routing
│   │   ├── App.css           # Styles
│   │   ├── pages/
│   │   │   ├── ListPage.tsx  # Content list
│   │   │   ├── CreatePage.tsx # Content creation
│   │   │   └── ViewPage.tsx   # Content viewer
│   ├── vite.config.ts        # Vite configuration
│   └── package.json
│
└── README.md
```

## 🔧 API Endpoints

- `GET /api/content` - List all content
- `GET /api/content/:id` - Get specific content for playing
- `POST /api/content` - Create new content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

## 📝 Next Steps / Improvements

To make the editor fully functional, you'll need to:

1. **Integrate H5P React Component** for the Create page:
```bash
cd frontend
npm install @lumieducation/h5p-react
```

2. **Update CreatePage.tsx** to use the H5P Editor component

3. **Add H5P Content Hub** integration to download content types

4. **Add authentication** for multi-user support

5. **Add database** (MongoDB/PostgreSQL) instead of file storage

## 🛠️ Technologies Used

- **Frontend:**
  - React 19
  - TypeScript
  - Vite
  - React Router
  - Axios

- **Backend:**
  - Express 5
  - @lumieducation/h5p-server
  - @lumieducation/h5p-express
  - i18next (internationalization)

## 📚 Resources

- [H5P Documentation](https://h5p.org)
- [h5p-nodejs-library GitHub](https://github.com/Lumieducation/H5P-Nodejs-library)
- [H5P React Components](https://www.npmjs.com/package/@lumieducation/h5p-react)

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 3001 is available
- Make sure H5P core/editor files are in `backend/h5p/`

**Frontend can't connect to backend:**
- Ensure backend is running on port 3001
- Check vite.config.ts proxy settings

**Editor not loading:**
- The Create page currently shows a placeholder
- To enable full editing, integrate @lumieducation/h5p-react

## 📄 License

MIT
