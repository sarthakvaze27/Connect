import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, ListItemText, ListItemIcon, Chip, IconButton, useMediaQuery, useTheme, Drawer, List, ListItem,Divider } from '@mui/material';
import { Toll, ShoppingCart, KeyboardArrowDown, AccountCircle, ExitToApp, BuildCircle, Dashboard, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TOKEN_PLANS } from '../constants/plans';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleOpenPricing = (event) => setAnchorEl(event.currentTarget);
  const handleClosePricing = () => setAnchorEl(null);

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #eee', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h5" onClick={() => navigate('/')} sx={{ fontWeight: 900, cursor: 'pointer', color: 'primary.main', letterSpacing: '-1px' }}>
          CONNECT<span style={{ color: '#167F73' }}>.</span>
        </Typography>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            {!isMobile && (
              <>
                {user.role !== 'professional' ? (
                  <Button variant="outlined" startIcon={<BuildCircle />} onClick={() => navigate('/become-pro')} sx={{ borderRadius: 3 }}>Become Pro</Button>
                ) : (
                  <Button variant="contained" startIcon={<Dashboard />} onClick={() => navigate('/pro-dashboard')} sx={{ borderRadius: 3, bgcolor: '#167F73' }}>Pro Panel</Button>
                )}
                <Button variant="text" startIcon={<ShoppingCart />} endIcon={<KeyboardArrowDown />} onClick={handleOpenPricing}>Credits</Button>
              </>
            )}

            <Chip 
              icon={<Toll sx={{ color: '#fbc02d !important' }} />} 
              label={`${user.tokens} Tokens`} 
              onClick={() => navigate('/profile')} 
              sx={{ fontWeight: 'bold', bgcolor: '#F3F7F6', border: 'none' }} 
            />

            <IconButton onClick={() => navigate('/profile')} sx={{ bgcolor: '#F3F7F6' }}><AccountCircle /></IconButton>
            
            {isMobile ? (
              <IconButton onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
            ) : (
              <IconButton onClick={onLogout} color="error"><ExitToApp /></IconButton>
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClosePricing} PaperProps={{ sx: { borderRadius: 3, mt: 1.5, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' } }}>
              {TOKEN_PLANS.map((plan) => (
                <MenuItem key={plan.id} onClick={handleClosePricing} sx={{ py: 1.5 }}>
                  <ListItemIcon><Toll sx={{ color: '#fbc02d' }} /></ListItemIcon>
                  <ListItemText primary={`${plan.tokens} Tokens`} secondary={`₹${plan.price}`} />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : (
          <Box><Button onClick={() => navigate('/login')} sx={{ fontWeight: 'bold' }}>Login</Button><Button variant="contained" onClick={() => navigate('/signup')} sx={{ ml: 2, borderRadius: 3, bgcolor: '#167F73' }}>Join Now</Button></Box>
        )}
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Menu</Typography>
          <Divider />
          <List>
            <ListItem button onClick={() => { navigate('/profile'); setMobileOpen(false); }}><ListItemText primary="My Profile" /></ListItem>
            {user?.role === 'professional' && <ListItem button onClick={() => { navigate('/pro-dashboard'); setMobileOpen(false); }}><ListItemText primary="Pro Dashboard" /></ListItem>}
            <ListItem button onClick={onLogout}><ListItemText primary="Logout" sx={{ color: 'error.main' }} /></ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
