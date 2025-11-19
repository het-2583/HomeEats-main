import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const API_URL = 'http://localhost:8000/api';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [searchCategory, setSearchCategory] = useState('');
  const [searchPincode, setSearchPincode] = useState('');
  const [searchStatus, setSearchStatus] = useState('Showing all available tiffins');

  const [tiffins, setTiffins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedTiffin, setSelectedTiffin] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');

  useEffect(() => {
    // Fetch featured tiffins on component mount
    fetchFeaturedTiffins();
  }, []);

  const fetchFeaturedTiffins = async () => {
    try {
      const response = await axios.get(`${API_URL}/tiffins/`);
      setTiffins(response.data.results);
    } catch (error) {
      setError('Failed to fetch featured tiffins');
    }
  };

  const fetchTiffins = async (pincode = '', category = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (pincode) params.pincode = pincode;
      if (category) params.search = category;
      
      const response = await axios.get(`${API_URL}/tiffins/`, { params });
      setTiffins(response.data.results);
    } catch (error) {
      setError('Failed to fetch tiffins. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const category = searchCategory.trim();
    const pincode = searchPincode.trim();
    
    if (!category && !pincode) {
      setSearchStatus('Showing all available tiffins');
      fetchTiffins();
    } else if (category && !pincode) {
      setSearchStatus(`Searching for "${category}" everywhere`);
      fetchTiffins('', category);
    } else if (!category && pincode) {
      setSearchStatus(`Showing all tiffins in pincode ${pincode}`);
      fetchTiffins(pincode, '');
    } else {
      setSearchStatus(`Searching for "${category}" in pincode ${pincode}`);
      fetchTiffins(pincode, category);
    }
  };

  const handleClearSearch = () => {
    setSearchCategory('');
    setSearchPincode('');
    setSearchStatus('Showing all available tiffins');
    fetchTiffins();
  };

  const handleOpenOrderDialog = (tiffin) => {
    if (!isAuthenticated) {
      toast.info('Please log in to place an order.');
      navigate('/login');
    } else {
      setSelectedTiffin(tiffin);
      setOrderQuantity(1);
      setDeliveryAddress('');
      setDeliveryPincode('');
      setOpenOrderDialog(true);
    }
  };

  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedTiffin(null);
  };

  const handlePlaceOrder = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_URL}/orders/`,
        {
          tiffin: selectedTiffin.id,
          quantity: orderQuantity,
          delivery_address: deliveryAddress,
          delivery_pincode: deliveryPincode,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order placed successfully!');
      handleCloseOrderDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Home Eats
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Discover delicious homemade food in your area
        </Typography>

        <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Search by Tiffin Name or Description"
                variant="outlined"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search by Pincode"
                variant="outlined"
                value={searchPincode}
                onChange={(e) => setSearchPincode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={6} sm={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                disabled={loading}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={6} sm={1.5}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearSearch}
                disabled={loading}
                sx={{ height: '56px' }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {searchStatus}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 6, mb: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {tiffins.length === 0 ? (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No tiffins found. Try a different search.
                </Typography>
              </Grid>
            ) : (
              tiffins.map((tiffin) => (
                <Grid item key={tiffin.id} xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={tiffin.image || 'https://via.placeholder.com/300x200'}
                      alt={tiffin.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="h2">
                        {tiffin.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tiffin.description}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                        ₹{tiffin.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Provided by: {tiffin.owner_name}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleOpenOrderDialog(tiffin)}
                      >
                        Order Now
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Box>

      {/* Order Dialog */}
      <Dialog open={openOrderDialog} onClose={handleCloseOrderDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Order {selectedTiffin?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Price: ₹{selectedTiffin?.price}
          </Typography>
          <TextField
            label="Quantity"
            type="number"
            fullWidth
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            sx={{ my: 2 }}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Delivery Address"
            fullWidth
            multiline
            rows={3}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Delivery Pincode"
            fullWidth
            value={deliveryPincode}
            onChange={(e) => setDeliveryPincode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog}>Cancel</Button>
          <Button
            onClick={handlePlaceOrder}
            variant="contained"
            disabled={!deliveryAddress || !deliveryPincode}
          >
            Place Order (Total: ₹{(selectedTiffin?.price || 0) * orderQuantity})
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Home; 