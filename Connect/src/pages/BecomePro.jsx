import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Paper, Chip, Stack, InputAdornment, IconButton, Divider } from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Search as SearchIcon, Add as AddIcon, Engineering } from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// Helper to move map view when address is searched
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

const BecomePro = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [location, setLocation] = useState({ lat: 18.5204, lon: 73.8567 });
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');

  const handleAddressSearch = async () => {
    if (!manualAddress) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setLocation({ lat: parseFloat(lat), lon: parseFloat(lon) });
        setManualAddress(display_name);
      } else {
        alert("Location not found. Please try a different search.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setLocation({ lat: e.latlng.lat, lon: e.latlng.lng });
      },
    });
    return <Marker position={[location.lat, location.lon]} />;
  }

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleUpgrade = async () => {
    if (!phone || phone.length < 10) return alert("Valid phone required");
    if (!profession) return alert("Please enter your profession");
    
    try {
      await api.patch('/profiles/update_profile', { 
        full_name: user?.full_name || "User", 
        phone,
        profession,
        skills,
        lat: location.lat,
        lon: location.lon,
        manual_address: manualAddress
      });
      
      const updated = await api.get('/auth/me');
      setUser(updated.data);
      navigate('/pro-dashboard');
    } catch (err) { 
      alert("Update failed: " + (err.response?.data?.detail || "Check console")); 
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5, mb: 8 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight="800" color="primary" gutterBottom>
          Professional Setup
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Complete your profile to start receiving service requests nearby.
        </Typography>
        
        <Stack spacing={2.5}>
          <TextField fullWidth label="Phone Number" variant="filled" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField fullWidth label="Your Profession" variant="filled" placeholder="e.g. Plumber, Developer, Tutor" onChange={(e) => setProfession(e.target.value)} />

          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Work Location</Typography>
            <TextField 
              fullWidth 
              size="small"
              placeholder="Search address or click on map..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleAddressSearch} color="primary"><SearchIcon /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ height: '220px', mt: 1, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <MapContainer center={[location.lat, location.lon]} zoom={12} style={{ height: '100%' }}>
                <ChangeView center={[location.lat, location.lon]} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker />
              </MapContainer>
            </Box>
          </Box>

          <Divider />

          {/* --- NEW SKILLS SECTION --- */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Engineering fontSize="small" /> Expertise & Skills
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              Add specific skills to help clients find you (e.g., "Pipe Repair", "React.js")
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField 
                size="small" 
                fullWidth 
                placeholder="Type a skill..." 
                value={currentSkill} 
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                onChange={(e) => setCurrentSkill(e.target.value)} 
              />
              <Button variant="contained" onClick={handleAddSkill} sx={{ minWidth: '80px' }}>
                Add
              </Button>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {skills.length === 0 && (
                <Typography variant="caption" italic color="text.disabled">No skills added yet.</Typography>
              )}
              {skills.map(s => (
                <Chip 
                  key={s} 
                  label={s} 
                  color="primary" 
                  variant="outlined" 
                  onDelete={() => setSkills(skills.filter(x => x !== s))} 
                />
              ))}
            </Stack>
          </Box>

          <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            color="secondary" 
            sx={{ py: 1.5, fontWeight: 'bold', mt: 2 }} 
            onClick={handleUpgrade}
          >
            Activate Pro Profile
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default BecomePro;