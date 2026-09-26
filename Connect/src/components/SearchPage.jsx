import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Box, Typography, Paper, 
  InputAdornment, CircularProgress, Stack, Divider, IconButton, Container,
  Grid 
} from '@mui/material';
import { MyLocation, Search as SearchIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import api from '../services/api';
import ProCard from '../components/ProCard';

// --- LEAFLET BUG FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Solves the "small line" issue by forcing Leaflet to recalculate size after mount
function MapController({ coords }) {
  const map = useMap();
  useEffect(() => {
    const invalidateSize = () => {
      map.invalidateSize({ pan: true, animate: false });
      map.setView([coords.lat, coords.lon], 13, { animate: false });
    };
    const container = map.getContainer();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidateSize) : null;
    if (observer && container.parentElement) observer.observe(container.parentElement);
    const timer = window.setTimeout(() => {
      invalidateSize();
      if (coords.lat && coords.lon) map.flyTo([coords.lat, coords.lon], 13);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [coords.lat, coords.lon, map]);
  return null;
}

function MapClickHandler({ setCoords, setAddressSearch }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setCoords({ lat, lon: lng });
      try {
        const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: { lat, lon: lng, format: 'json' },
          headers: { 'User-Agent': 'ConnectApp_v1' }
        });
        if (res.data?.display_name) setAddressSearch(res.data.display_name);
      } catch (err) { console.error("Reverse-geo failed", err); }
    },
  });
  return null;
}

const SearchPage = () => {
  const [profession, setProfession] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [unlockingId, setUnlockingId] = useState(null);
  const [coords, setCoords] = useState({ lat: 18.5204, lon: 73.8567 });

  // Handle GPS with fallback for Desktop/Unavailable positions
  const handleAutoGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setCoords({ lat, lon });
        
        try {
          const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { lat, lon, format: 'json' },
            headers: { 'User-Agent': 'ConnectApp_v1' }
          });
          if (res.data?.display_name) setAddressSearch(res.data.display_name);
        } catch (e) { console.error("GPS address fetch failed", e); }
      },
      (error) => {
        console.warn("GPS Error Code:", error.code);
        alert("Your device cannot provide a GPS location right now. Please type your city name manually.");
      },
      { enableHighAccuracy: false, timeout: 10000 } 
    );
  };

  const handleLookupAddress = async () => {
    if (!addressSearch) return;
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: addressSearch, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'ConnectApp_v1' }
      });
      if (res.data.length > 0) {
        setCoords({ lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) });
      }
    } catch (err) { console.error("Search failed", err); }
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await api.get('/search/find-nearby', {
        params: { lat: coords.lat, lon: coords.lon, profession, max_km: 15 }
      });
      setResults(res.data);
    } catch (err) { console.error("Backend search failed", err); }
    setSearching(false);
  };

  const handleUnlock = async (proId) => {
    setUnlockingId(proId);
    try {
      const res = await api.post(`/profiles/unlock/${proId}`);
      setResults(prev => prev.map(p => 
        (p.id === proId || p._id === proId) ? { ...p, is_unlocked: true, phone: res.data.phone } : p
      ));
      alert("Professional Unlocked!");
    } catch (err) { alert(err.response?.data?.detail || "Unlock failed"); }
    finally { setUnlockingId(null); }
  };

  return (
    <Box sx={{ bgcolor: '#F3F7F6', minHeight: '100vh', pb: 10 }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #DFE8E6', p: 3 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            
            {/* SEARCH SIDEBAR */}
            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #DFE8E6' }}>
                <Typography variant="h5" fontWeight="900" sx={{ color: '#17343A', mb: 1 }}>Expert Locator</Typography>
                <Stack spacing={3}>
                  <TextField 
                    fullWidth label="Location" value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleLookupAddress} size="small"><SearchIcon color="primary" /></IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button startIcon={<MyLocation />} onClick={handleAutoGPS} sx={{ fontWeight: 'bold' }}>
                    Use Current GPS
                  </Button>
                  <Divider />
                  <TextField 
                    fullWidth label="Profession" value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Electrician"
                  />
                  <Button variant="contained" fullWidth size="large" onClick={handleSearch} disabled={searching}>
                    {searching ? <CircularProgress size={24} /> : "Find Experts"}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
            
            {/* FIXED MAP CONTAINER */}
            <Grid size={{ xs: 12, md: 8, lg: 8 }}>
              <Box sx={{ 
                height: { xs: '350px', md: '550px' }, 
                minHeight: { xs: '350px', md: '550px' }, 
                width: '100%', 
                borderRadius: 6, 
                overflow: 'hidden', 
                border: '1px solid #DFE8E6',
                position: 'relative',
                bgcolor: '#eee' 
              }}>
                <MapContainer 
                  center={[coords.lat, coords.lon]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <MapClickHandler setCoords={setCoords} setAddressSearch={setAddressSearch} />
                  <MapController coords={coords} />
                  <Marker position={[coords.lat, coords.lon]}><Popup>Search Center</Popup></Marker>
                  {results.map((pro) => (
                    <Marker key={pro.id || pro._id} position={[pro.location.coordinates[1], pro.location.coordinates[0]]}>
                      <Popup><Typography variant="subtitle2" fontWeight="bold">{pro.full_name}</Typography></Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Box>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* RESULTS LIST */}
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <Typography variant="h5" fontWeight="800" sx={{ color: '#17343A', mb: 4 }}>
          Nearby Professionals ({results.length})
        </Typography>
        <Grid container spacing={3}>
          {results.map(pro => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={pro.id || pro._id}>
              <ProCard pro={pro} isUnlocking={unlockingId === (pro.id || pro._id)} onUnlock={handleUnlock} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default SearchPage;


