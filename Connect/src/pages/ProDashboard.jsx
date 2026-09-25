import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Switch, 
  FormControlLabel, Divider, List, ListItem, ListItemText, 
  Chip, CircularProgress, Stack, useTheme 
} from '@mui/material';
import { Visibility, PhoneEnabled, Star, Person, Speed, History } from '@mui/icons-material';
import api from '../services/api';

const ProDashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({ views: 0, unlocks: 0, rating: 5.0 });
  const [leads, setLeads] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/profiles/my-stats');
        setStats(res.data.summary);
        setLeads(res.data.recent_leads);
        setIsAvailable(res.data.is_available);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleToggle = async (e) => {
    const status = e.target.checked;
    setIsAvailable(status);
    try { await api.patch('/profiles/toggle-availability', { is_available: status }); }
    catch { setIsAvailable(!status); }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: '#167F73' }} />
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#F3F7F6', minHeight: '100vh', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="xl">
        {/* --- HEADER SECTION --- */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 5, mb: 4, border: '1px solid #DFE8E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="900" sx={{ color: '#17343A' }}>Pro Panel</Typography>
            <Typography variant="body2" color="text.secondary">Manage your visibility and track incoming leads</Typography>
          </Box>
          <Paper variant="outlined" sx={{ px: 3, py: 1, borderRadius: 4, display: 'flex', alignItems: 'center', bgcolor: isAvailable ? '#f0fff4' : '#fff5f5' }}>
            <FormControlLabel
              control={<Switch checked={isAvailable} onChange={handleToggle} color="success" />}
              label={isAvailable ? "YOU ARE LIVE" : "CURRENTLY OFFLINE"}
              sx={{ m: 0, '& .MuiFormControlLabel-label': { fontWeight: '800', fontSize: '0.75rem', color: isAvailable ? '#22c55e' : '#ef4444' } }}
              labelPlacement="start"
            />
          </Paper>
        </Paper>

        {/* --- TOP STATS ROW: Now centered and filling width --- */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <StatCard icon={<Visibility sx={{ color: '#167F73' }} />} label="Profile Views" value={stats.views} color="#167F73" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard icon={<PhoneEnabled sx={{ color: '#22c55e' }} />} label="Contact Unlocks" value={stats.unlocks} color="#22c55e" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard icon={<Star sx={{ color: '#ffb800' }} />} label="Avg Rating" value={stats.rating?.toFixed(1)} color="#ffb800" />
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* --- RECENT LEADS (Left Side on Laptop) --- */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #DFE8E6', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <History color="primary" />
                <Typography variant="h6" fontWeight="800" sx={{ color: '#17343A' }}>Recent Leads</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ width: '100%' }}>
                {leads.length > 0 ? leads.map((l, i) => (
                  <ListItem 
                    key={i} 
                    sx={{ 
                      mb: 2, bgcolor: '#f9faff', borderRadius: 4, border: '1px solid #f0f2f8',
                      '&:hover': { bgcolor: '#F3F7F6' }
                    }}
                  >
                    <Box sx={{ mr: 2, p: 1, bgcolor: 'white', borderRadius: 3, display: 'flex' }}>
                      <Person color="action" />
                    </Box>
                    <ListItemText 
                      primary={<Typography fontWeight="bold">{l.user_name}</Typography>} 
                      secondary={new Date(l.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                    />
                    <Chip label="New Lead" size="small" sx={{ bgcolor: '#167F73', color: 'white', fontWeight: 'bold' }} />
                  </ListItem>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">No leads yet. Make sure your profile is "LIVE"!</Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>

          {/* --- PERFORMANCE TIPS (Right Side on Laptop) --- */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #DFE8E6', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Speed color="primary" />
                <Typography variant="h6" fontWeight="800" sx={{ color: '#17343A' }}>Performance Tips</Typography>
              </Box>
              <Stack spacing={3}>
                <TipBox title="Complete your Bio" desc="Profiles with clear bios get 40% more unlocks." />
                <TipBox title="Add more Skills" desc="More skills help you appear in wider searches." />
                <TipBox title="Stay Online" desc="Clients prefer professionals who are currently LIVE." />
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// Sub-component for individual Stat Cards
const StatCard = ({ icon, label, value, color }) => (
  <Paper elevation={0} sx={{ p: 3, borderRadius: 6, border: '1px solid #DFE8E6', display: 'flex', alignItems: 'center', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' } }}>
    <Box sx={{ width: 60, height: 60, borderRadius: 4, bgcolor: `${color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', mr: 3 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h4" fontWeight="900" sx={{ color: '#17343A', lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
    </Box>
  </Paper>
);

const TipBox = ({ title, desc }) => (
  <Box sx={{ p: 2, borderRadius: 4, bgcolor: '#F3F7F6', border: '1px solid #DFE8E6' }}>
    <Typography variant="subtitle2" fontWeight="800" gutterBottom>{title}</Typography>
    <Typography variant="caption" color="text.secondary">{desc}</Typography>
  </Box>
);

export default ProDashboard;
