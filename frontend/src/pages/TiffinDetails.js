import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const API_URL = 'http://localhost:8000/api';

const TiffinDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tiffin, setTiffin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    fetchTiffinDetails();
  }, [id]);

  const fetchTiffinDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/tiffins/${id}/`);
      setTiffin(response.data);
    } catch (error) {
      setError('Failed to fetch tiffin details');
      toast.error('Failed to fetch tiffin details');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = () => {
    if (!isAuthenticated) {
      setOpenLoginDialog(true);
    } else {
      navigate(`/customer/dashboard?order=${id}`);
    }
  };

  const handleLoginClick = () => {
    navigate('/login', { state: { redirectTo: `/tiffin/${id}` } });
  };

  const handleRegisterClick = () => {
    navigate('/register', { state: { redirectTo: `/tiffin/${id}` } });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tiffin) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ mt: 4 }}>
          {error || 'Tiffin not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card>
        {tiffin.image && (
          <CardMedia
            component="img"
            height="400"
            image={tiffin.image}
            alt={tiffin.name}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            {tiffin.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {tiffin.description}
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            ₹{tiffin.price}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Provided by: {tiffin.owner_name}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleOrderClick}
              disabled={!tiffin.is_available}
            >
              {tiffin.is_available ? 'Order Now' : 'Currently Unavailable'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Login/Register Dialog */}
      <Dialog open={openLoginDialog} onClose={() => setOpenLoginDialog(false)}>
        <DialogTitle>Login Required</DialogTitle>
        <DialogContent>
          <Typography>
            Please login or create an account to place an order.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLoginClick}
          >
            Login
          </Button>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleRegisterClick}
          >
            Create Account
          </Button>
          <Button
            onClick={() => setOpenLoginDialog(false)}
            color="inherit"
            fullWidth
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TiffinDetails; 