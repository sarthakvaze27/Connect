import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Alert, Paper } from '@mui/material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Send credentials to FastAPI as form data
      const formData = new FormData();
      formData.append('username', email);  // OAuth2 expects 'username' field
      formData.append('password', password);
      
      const res = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // 2. Save the JWT Token to LocalStorage (The "ID Badge")
      localStorage.setItem('token', res.data.access_token);
      console.log("Token saved to localStorage:", res.data.access_token); // Debug
      
      // 3. Update global user state so Navbar shows tokens
      console.log("Login response:", res.data); // Debug line
      setUser(res.data.user);
      
      // 4. Redirect to the search map
      navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
          Login to Connect
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField 
            fullWidth label="Email Address" margin="normal" variant="outlined" required
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <TextField 
            fullWidth label="Password" type="password" margin="normal" variant="outlined" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <Button 
            type="submit" fullWidth variant="contained" size="large" 
            sx={{ mt: 3, py: 1.5 }} disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account? <Button onClick={() => navigate('/signup')}>Sign Up</Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;