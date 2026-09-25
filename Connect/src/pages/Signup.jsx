import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Alert, Paper, Select, MenuItem } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MyLocation, CheckCircle } from '@mui/icons-material';
import api from '../services/api';

const Signup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'client',
        referral_code: searchParams.get('ref') || '', 
        lat: null,
        lon: null
    });
    const [error, setError] = useState('');

    const getGPS = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setFormData({ ...formData, lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => setError("Location access denied. Professionals must be tagged to be found.")
        );
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const url = formData.referral_code 
                ? `/auth/signup?referral_code=${formData.referral_code}` 
                : `/auth/signup`;

            const signupPayload = {
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                lat: formData.lat,
                lon: formData.lon
            };

            await api.post(url, signupPayload);
            alert("Signup successful!");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || "Signup failed");
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
                <Typography variant="h5" fontWeight="900" gutterBottom sx={{ color: '#17343A' }}>Join Connect</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <form onSubmit={handleSignup}>
                    <TextField fullWidth label="Full Name" margin="normal" required
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                    <TextField fullWidth label="Email" margin="normal" required
                        onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    <TextField fullWidth label="Password" type="password" margin="normal" required
                        onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    
                    <Select fullWidth value={formData.role} sx={{ mt: 2, mb: 1 }}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}>
                        <MenuItem value="client">Client (Looking for services)</MenuItem>
                        <MenuItem value="professional">Professional (Offering services)</MenuItem>
                    </Select>

                    <TextField fullWidth label="Referral Code (Optional)" margin="normal"
                        value={formData.referral_code}
                        onChange={(e) => setFormData({...formData, referral_code: e.target.value})} 
                        helperText="Enter a friend's code to get bonus tokens!" />

                    {formData.role === 'professional' && (
                        <Button fullWidth startIcon={formData.lat ? <CheckCircle color="success"/> : <MyLocation />} 
                            onClick={getGPS} variant="outlined" sx={{ my: 2, borderRadius: '12px' }}>
                            {formData.lat ? "Location Captured" : "Tag My Service Location"}
                        </Button>
                    )}
                    
                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5, fontWeight: 'bold', bgcolor: '#167F73', borderRadius: '12px' }}>
                        Register
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default Signup;

