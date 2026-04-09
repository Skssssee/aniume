import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AnimeDetail from './pages/AnimeDetail';
import Watch from './pages/Watch';
import Navbar from './components/Navbar';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/anime/:slug" element={<AnimeDetail />} />
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
