import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import SearchPage from './components/SearchPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import BecomePro from './pages/BecomePro';
import ProDashboard from './pages/ProDashboard';
import api from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me'); 
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  // --- NEW: THE MISSING UPDATE HANDLER ---
  const handleUpdateSuccess = (updatedUser) => {
    // We merge the new data from the server with the existing user object
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUser,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} /> 
      <Box sx={{ minHeight: '100vh', pt: 10 }}> 
        <Routes>
          <Route path="/" element={<SearchPage user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Added onUpdateSuccess prop here */}
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} onUpdateSuccess={handleUpdateSuccess} /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/become-pro" 
            element={user ? <BecomePro user={user} setUser={handleUpdateSuccess} /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/pro-dashboard" 
            element={user?.role === 'professional' ? <ProDashboard /> : <Navigate to="/login" />} 
          />
        </Routes>
      </Box>
    </Router>
  );
}