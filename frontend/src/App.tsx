import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ListPage from './pages/ListPage';
import CreatePage from './pages/CreatePage';
import ViewPage from './pages/ViewPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <h1>H5P Content Manager</h1>
          <div className="nav-links">
            <Link to="/">📋 List</Link>
            <Link to="/create">➕ Create</Link>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/view/:id" element={<ViewPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
