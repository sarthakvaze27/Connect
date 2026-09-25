import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, Avatar, Grid, Divider, 
  Chip, Stack, Button, TextField, IconButton, CircularProgress 
} from '@mui/material';
import { 
  Edit, Save, Cancel, Email, LocationOn, 
  ContentCopy, Phone, Build 
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// --- LEAFLET BUG FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 300);
  }, [map]);
  return null;
}

function LocationPicker({ setCoords }) {
  useMapEvents({
    click: (e) => setCoords({ lat: e.latlng.lat, lon: e.latlng.lng }),
  });
  return null;
}

const Profile = ({ user, onUpdateSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editData, setEditData] = useState({
    full_name: '', phone: '', profession: '', bio: '', skills: '', 
    lat: 18.5204, lon: 73.8567 
  });

  // --- CRITICAL SYNC LOGIC ---
  useEffect(() => {
    if (user) {
      setEditData({
        full_name: user.full_name || '',
        phone: user.phone || '', // Ensure phone is captured here
        profession: user.profession || '',
        bio: user.bio || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
        lat: user.location?.coordinates?.[1] || 18.5204,
        lon: user.location?.coordinates?.[0] || 73.8567
      });
    }
  }, [user]); // Runs whenever the 'user' prop changes from the parent

  if (!user) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  // ... (imports remain same)
const handleSave = async () => {
    setLoading(true);
    try {
      const skillsArr = typeof editData.skills === 'string' 
        ? editData.skills.split(',').map(s => s.trim()).filter(s => s !== "") 
        : editData.skills;

      // Ensure 'phone' is always included in payload for both roles
      const payload = user.role === 'professional' 
        ? { ...editData, skills: skillsArr }
        : { full_name: editData.full_name, phone: editData.phone };

      const res = await api.patch('/profiles/update', payload);
      
      if (res.data) {
        setIsEditing(false);
        if (onUpdateSuccess) onUpdateSuccess(res.data);
        alert("Profile Updated Successfully!");
      }
    } catch (err) { alert("Update failed"); }
    finally { setLoading(false); }
};
// ... (rest remains same)
  const copyReferral = () => {
    navigator.clipboard.writeText(user.referral_code || '');
    alert("Referral code copied!");
  };

  const isPro = user.role === 'professional';

  return (
    <Box sx={{ bgcolor: '#F3F7F6', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #DFE8E6', pt: 6, pb: 4, mb: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 100, height: 100, bgcolor: '#167F73', fontSize: '2.5rem', fontWeight: 'bold' }}>
                {user.full_name?.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="900" sx={{ color: '#17343A' }}>{user.full_name}</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Chip label={user.role?.toUpperCase()} size="small" sx={{ fontWeight: '800', bgcolor: '#F3F7F6', color: '#167F73' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#667B79' }}>
                  <Email fontSize="small" /> {user.email}
                </Box>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" startIcon={isEditing ? <Cancel /> : <Edit />} onClick={() => setIsEditing(!isEditing)} sx={{ borderRadius: '12px', fontWeight: 'bold', textTransform: 'none' }}>
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
                {isEditing && (
                  <Button variant="contained" onClick={handleSave} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />} sx={{ borderRadius: '12px', bgcolor: '#167F73', fontWeight: 'bold', textTransform: 'none' }}>
                    Save Changes
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={isPro ? 7 : 12}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: '1px solid #DFE8E6' }}>
                <Typography variant="h6" fontWeight="800" color="#17343A" gutterBottom>Account Information</Typography>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="#667B79" sx={{ mb: 1 }}>FULL NAME</Typography>
                    {isEditing ? <TextField fullWidth size="small" value={editData.full_name} onChange={(e) => setEditData({...editData, full_name: e.target.value})} /> : <Typography fontWeight="bold" color="#17343A">{user.full_name}</Typography>}
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="#667B79" sx={{ mb: 1 }}>PHONE NUMBER</Typography>
                    {isEditing ? <TextField fullWidth size="small" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} /> : <Typography fontWeight="bold" color="#17343A">{user.phone || "Not set"}</Typography>}
                  </Box>

                  {isPro && (
                    <>
                      <Box>
                        <Typography variant="subtitle2" color="#667B79" sx={{ mb: 1 }}>PROFESSION</Typography>
                        {isEditing ? <TextField fullWidth size="small" value={editData.profession} onChange={(e) => setEditData({...editData, profession: e.target.value})} /> : <Typography fontWeight="bold" color="#17343A">{user.profession || "Not set"}</Typography>}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="#667B79" sx={{ mb: 1 }}>BIO</Typography>
                        {isEditing ? <TextField fullWidth multiline rows={3} value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} /> : <Typography color="textSecondary">{user.bio || "No bio added."}</Typography>}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="#667B79" sx={{ mb: 1 }}>SKILLS</Typography>
                        {isEditing ? <TextField fullWidth size="small" placeholder="Skill 1, Skill 2" value={editData.skills} onChange={(e) => setEditData({...editData, skills: e.target.value})} /> : 
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>{user.skills?.map((s, i) => <Chip key={i} label={s} size="small" sx={{ fontWeight: 'bold' }} />)}</Stack>}
                      </Box>
                    </>
                  )}
                </Stack>
              </Paper>

              {/* Referral Code */}
              <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: '1px solid #DFE8E6', bgcolor: '#167F73', color: 'white' }}>
                <Typography variant="h6" fontWeight="800">Your Referral Code</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>Earn 10 bonus tokens for every friend who joins!</Typography>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" fontWeight="900" letterSpacing={2}>{user.referral_code}</Typography>
                  <IconButton onClick={copyReferral} sx={{ color: 'white' }}><ContentCopy /></IconButton>
                </Box>
              </Paper>
            </Stack>
          </Grid>

          {isPro && (
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: '1px solid #DFE8E6', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="800" color="#17343A">Service Area</Typography>
                <Typography variant="body2" color="#667B79" sx={{ mb: 2 }}>{isEditing ? "Click the map to update your location." : "Your location visible to clients."}</Typography>
                
                <Box sx={{ flexGrow: 1, minHeight: '350px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #DFE8E6' }}>
                  <MapContainer key={isEditing ? 'edit' : 'view'} center={[editData.lat, editData.lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapResizer />
                    {isEditing && <LocationPicker setCoords={(c) => setEditData({...editData, ...c})} />}
                    <Marker position={[editData.lat, editData.lon]}>
                      <Popup>{isEditing ? "New Pin" : "Your Location"}</Popup>
                    </Marker>
                  </MapContainer>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#667B79' }}>
                  <LocationOn fontSize="small" />
                  <Typography variant="caption" fontWeight="bold">Coords: {editData.lat.toFixed(4)}, {editData.lon.toFixed(4)}</Typography>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;
