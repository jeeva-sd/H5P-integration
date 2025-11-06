import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import PlayerPage from './pages/PlayerPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>H5P Prototype</h1>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<EditorPage />} />
            <Route path="/edit/:contentId" element={<EditorPage />} />
            <Route path="/play/:contentId" element={<PlayerPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
