import React, { useEffect } from 'react';
import { 
  Typography, Button, Box, Chip, Avatar, 
  Badge, CircularProgress, Paper, Stack, Divider 
} from '@mui/material';
import { 
  CheckCircle, FiberManualRecord, Star, Verified, 
  Phone, LockOpen 
} from '@mui/icons-material';
import api from '../services/api';

const ProCard = ({ pro, onUnlock, isUnlocking }) => {

  useEffect(() => {
    // Increment view count when card is displayed
    const proId = pro?.id || pro?._id;
    if(proId) {
      api.post(`/profiles/increment-view/${proId}`).catch(() => {});
    }
  }, [pro]);
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2.5, 
        borderRadius: 5, 
        border: '1px solid #DFE8E6', 
        transition: 'all 0.3s ease',
        bgcolor: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '&:hover': { 
          boxShadow: '0 15px 35px rgba(0,0,0,0.06)',
          transform: 'translateY(-4px)',
          borderColor: '#167F73'
        }
      }}
    >
      {/* Header: Avatar & Rating */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <FiberManualRecord sx={{ 
              color: pro.is_available ? '#22c55e' : '#cbd5e0', 
              fontSize: 14, border: '2px solid white', borderRadius: '50%' 
            }} />
          }
        >
          <Avatar 
            sx={{ width: 55, height: 55, bgcolor: '#F3F7F6', color: '#167F73', fontWeight: 'bold' }}
          >
            {pro.full_name?.[0] || pro.profession?.[0] || 'P'}
          </Avatar>
        </Badge>
        
        <Box sx={{ textAlign: 'right' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <Star sx={{ color: '#FFB800', fontSize: 18 }} />
            <Typography variant="body2" fontWeight="800">{pro.rating?.toFixed(1) || "5.0"}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">Rating</Typography>
        </Box>
      </Box>

      {/* Info: Name & Profession */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#17343A', lineHeight: 1.2 }}>
          {pro.full_name} {pro.role === 'professional' && <Verified sx={{ fontSize: 16, color: '#167F73', ml: 0.5 }} />}
        </Typography>
        <Typography variant="caption" fontWeight="700" color="primary" sx={{ display: 'block', mt: 0.5 }}>
          {pro.profession} • {pro.experience_years || 0} Years Exp.
        </Typography>
      </Box>

      {/* Bio Section */}
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mb: 2, 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical', 
          overflow: 'hidden',
          minHeight: '40px',
          fontSize: '0.85rem'
        }}
      >
        {pro.bio || "Professional expert available for on-demand service requests in your locality."}
      </Typography>

      {/* Skills Section */}
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.8, mb: 3, flexGrow: 1 }}>
        {pro.skills?.slice(0, 3).map(skill => (
          <Chip 
            key={skill} 
            label={skill} 
            size="small" 
            sx={{ bgcolor: '#F3F7F6', color: '#167F73', fontWeight: '700', fontSize: '0.7rem', borderRadius: 1.5 }} 
          />
        ))}
        {pro.skills?.length > 3 && (
            <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.disabled', fontWeight: 'bold' }}>
                +{pro.skills.length - 3} more
            </Typography>
        )}
      </Stack>

      <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

      {/* Action Section: Conditional Connect vs Contact Info */}
      {pro.is_unlocked ? (
        <Box 
            sx={{ 
                p: 1.5, 
                bgcolor: '#F0FDF4', 
                borderRadius: 3, 
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}
        >
            <Avatar sx={{ bgcolor: '#22C55E', width: 40, height: 40 }}>
                <Phone sx={{ color: 'white', fontSize: 20 }} />
            </Avatar>
            <Box>
                <Typography variant="caption" fontWeight="bold" color="#166534" display="block">
                    CONTACT UNLOCKED
                </Typography>
                <Typography variant="h6" fontWeight="900" color="#17343A">
                    {pro.phone || "No phone listed"}
                </Typography>
            </Box>
        </Box>
      ) : (
        <Button 
          fullWidth 
          variant="contained" 
          disabled={isUnlocking}
          onClick={() => onUnlock(pro.id || pro._id)}
          startIcon={isUnlocking ? <CircularProgress size={18} color="inherit" /> : <LockOpen sx={{ fontSize: 18 }} />}
          sx={{ 
            borderRadius: 3, 
            py: 1.2, 
            textTransform: 'none', 
            fontWeight: '800',
            bgcolor: '#167F73',
            boxShadow: '0 10px 20px rgba(22, 127, 115, 0.15)',
            '&:hover': { bgcolor: '#12695F' }
          }}
        >
          {isUnlocking ? "Processing..." : "Connect (10 Tokens)"}
        </Button>
      )}
    </Paper>
  );
};

export default ProCard;
