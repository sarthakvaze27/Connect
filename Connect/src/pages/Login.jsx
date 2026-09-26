import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Alert, Paper } from '@mui/material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const getApiError = (err, fallback) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => {
    const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "Field";
    return String(field) + ": " + String(item.msg);
  }).join("; ");
  return fallback;
};
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
      const res = await api.post('/auth/login', { email, password });
      
      // 2. Save the JWT Token to LocalStorage (The "ID Badge")
      localStorage.setItem('token', res.data.access_token);
      // Update global user state so Navbar shows tokens.
      setUser(res.data.user);
      
      // 4. Redirect to the search map
      navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      setError(getApiError(err, "Invalid email or password"));
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
            fullWidth type="email" label="Email Address" margin="normal" variant="outlined" required
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

