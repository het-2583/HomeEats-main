import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNotifications } from '../contexts/NotificationContext';
import Pagination from '@mui/material/Pagination';

const API_URL = 'http://localhost:8000/api';

const CustomerDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [tiffins, setTiffins] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCategory, setSearchCategory] = useState('');
  const [searchPincode, setSearchPincode] = useState('');
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedTiffin, setSelectedTiffin] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [userPincode, setUserPincode] = useState('');
  const deliveredOrderIds = useRef(new Set());
  const prevOrdersRef = useRef([]);
  const { addNotification, notifications, clearNotifications } = useNotifications();
  const [orderHistoryPage, setOrderHistoryPage] = useState(1);
  const pageSize = 10;
  const [searchStatus, setSearchStatus] = useState('');

  const orderHistoryAll = orders
    .filter(order => ['delivered', 'cancelled', 'ready_for_delivery', 'picked_up'].includes(order.status))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const totalOrderHistoryPages = Math.max(1, Math.ceil(orderHistoryAll.length / pageSize));
  const paginatedOrderHistory = orderHistoryAll.slice((orderHistoryPage - 1) * pageSize, orderHistoryPage * pageSize);

  const ownerTiffinIds = tiffins.map(t => t.id);
  const activeOrdersAll = orders.filter(
    order => ownerTiffinIds.includes(order.tiffin) && ['pending', 'confirmed', 'preparing'].includes(order.status)
  );
  const totalActivePages = Math.max(1, Math.ceil(activeOrdersAll.length / pageSize));

  useEffect(() => {
    fetchUserPincode();
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prevOrdersRef.current.length > 0) {
      // Map previous orders by id for quick lookup
      const prevMap = {};
      prevOrdersRef.current.forEach(order => {
        prevMap[order.id] = order.status;
      });
      orders.forEach(order => {
        if (
          order.status === 'delivered' &&
          prevMap[order.id] && prevMap[order.id] !== 'delivered'
        ) {
          addNotification('Your order is delivered successfully.');
        }
      });
    }
    prevOrdersRef.current = orders;
  }, [orders, addNotification]);

  // On mount and after fetching orders, notify for delivered orders if not already notified
  useEffect(() => {
    console.log('Checking for delivered orders', orders);
    if (!orders || orders.length === 0) return;
    // Get notified order IDs from localStorage
    const notifiedIds = JSON.parse(localStorage.getItem('delivered_notified_ids') || '[]');
    let updated = false;
    orders.forEach(order => {
      if (order.status === 'delivered' && !notifiedIds.includes(order.id)) {
        console.log('Adding notification for order', order.id);
        addNotification('Your order is delivered successfully.');
        notifiedIds.push(order.id);
        updated = true;
      }
    });
    if (updated) {
      console.log('Updated notifiedIds:', notifiedIds);
      localStorage.setItem('delivered_notified_ids', JSON.stringify(notifiedIds));
    }
  }, [orders, addNotification]);

  useEffect(() => {
    if (orderHistoryPage > totalOrderHistoryPages) setOrderHistoryPage(1);
  }, [totalOrderHistoryPages]);

  const fetchUserPincode = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pincode = response.data.pincode;
      setUserPincode(pincode);
      setSearchStatus(`Showing all tiffins in your area (${pincode})`);
      console.log('Customer user pincode fetched:', pincode); // Debug log
      fetchTiffins(pincode);
    } catch (error) {
      console.error('Error fetching customer user data:', error); // Debug log
      setError(error.response?.data?.detail || 'Failed to fetch user data');
      toast.error(error.response?.data?.detail || 'Failed to fetch user data');
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      let allOrders = [];
      let nextUrl = `${API_URL}/orders/`;
      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        allOrders = allOrders.concat(response.data.results);
        nextUrl = response.data.next;
      }
      setOrders(allOrders);
    } catch (error) {
      // Optionally handle error
    }
  };

  const fetchTiffins = async (pincode = '', category = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      
      // Only add pincode parameter if it's provided and different from user's pincode
      if (pincode && pincode !== userPincode) {
        params.pincode = pincode;
      } else if (pincode) {
        // If pincode is same as user's pincode, still add it to ensure we get results
        params.pincode = pincode;
      }
      
      // Only add search parameter if category is provided
      if (category && category.trim()) {
        params.search = category.trim();
      }
      
      console.log('Fetching tiffins with params:', params); // Debug log
      const response = await axios.get(`${API_URL}/tiffins/`, {
        params: params,
      });
      console.log('Tiffins fetched successfully:', response.data.results); // Debug log
      setTiffins(response.data.results);
    } catch (error) {
      console.error('Error fetching tiffins:', error); // Debug log
      setError(error.response?.data?.detail || 'Failed to fetch tiffins. Please try again later.');
      toast.error(error.response?.data?.detail || 'Failed to fetch tiffins.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const searchCategoryValue = searchCategory.trim();
    const searchPincodeValue = searchPincode.trim();
    
    // If both fields are empty, show tiffins in user's area
    if (!searchCategoryValue && !searchPincodeValue) {
      setSearchStatus(`Showing all tiffins in your area (${userPincode})`);
      fetchTiffins(userPincode, '');
      return;
    }
    
    // If only pincode is provided, search by pincode only
    if (!searchCategoryValue && searchPincodeValue) {
      setSearchStatus(`Showing all tiffins in pincode ${searchPincodeValue}`);
      fetchTiffins(searchPincodeValue, '');
      return;
    }
    
    // If only category is provided, search by name/description in user's area
    if (searchCategoryValue && !searchPincodeValue) {
      setSearchStatus(`Searching for "${searchCategoryValue}" in your area (${userPincode})`);
      fetchTiffins(userPincode, searchCategoryValue);
      return;
    }
    
    // If both are provided, search by both
    if (searchCategoryValue && searchPincodeValue) {
      setSearchStatus(`Searching for "${searchCategoryValue}" in pincode ${searchPincodeValue}`);
      fetchTiffins(searchPincodeValue, searchCategoryValue);
      return;
    }
  };

  const handleClearSearch = () => {
    setSearchCategory('');
    setSearchPincode('');
    setSearchStatus(`Showing all tiffins in your area (${userPincode})`);
    fetchTiffins(userPincode, '');
  };

  const handleOpenOrderDialog = (tiffin) => {
    setSelectedTiffin(tiffin);
    setOrderQuantity(1);
    // Pre-fill delivery address and pincode from user profile if available
    // For now, assume these are empty or come from some user context
    setDeliveryAddress('');
    setDeliveryPincode('');
    setOpenOrderDialog(true);
  };

  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedTiffin(null);
    setOrderQuantity(1);
    setDeliveryAddress('');
    setDeliveryPincode('');
  };

  const handlePlaceOrder = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please log in to place an order.');
        return;
      }

      await axios.post(
        `${API_URL}/orders/`,
        {
          tiffin: selectedTiffin.id,
          quantity: orderQuantity,
          delivery_address: deliveryAddress,
          delivery_pincode: deliveryPincode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Order placed successfully!');
      addNotification('Your order is placed successfully.');
      fetchOrders();
      handleCloseOrderDialog();
      // Optionally refresh tiffins or update UI
    } catch (error) {
      const data = error.response?.data;
      let message = 'Failed to place order.';
      if (data) {
        if (typeof data === 'string') {
          message = data;
        } else if (Array.isArray(data)) {
          message = data.join(' ');
        } else if (data.wallet) {
          message = Array.isArray(data.wallet) ? data.wallet.join(' ') : data.wallet;
        } else if (data.detail) {
          message = data.detail;
        } else if (data.non_field_errors) {
          const errs = data.non_field_errors;
          message = Array.isArray(errs) ? errs.join(' ') : errs;
        }
      }
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  const handleOrderHistoryPageChange = (event, value) => {
    setOrderHistoryPage(value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  console.log('OwnerDashboard notifications context:', notifications);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Customer Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Browse Tiffins" />
          <Tab label="Order History" />
          <Tab label="Notifications" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Search by Tiffin Name or Description"
                  variant="outlined"
                  size="small"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Search by Pincode"
                  variant="outlined"
                  size="small"
                  value={searchPincode}
                  onChange={(e) => setSearchPincode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  fullWidth
                  placeholder={userPincode ? `Current: ${userPincode}` : 'Enter pincode'}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button variant="contained" onClick={handleSearch} fullWidth>
                  Search
                </Button>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button variant="outlined" onClick={handleClearSearch} fullWidth>
                  Clear
                </Button>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Search by tiffin name/description OR pincode OR both. Leave pincode empty to search in your area ({userPincode || 'Loading...'}). Leave name empty to see all tiffins in a specific pincode.
            </Typography>
            {searchStatus && (
              <Typography variant="body2" color="primary" sx={{ mt: 1, display: 'block', fontWeight: 'medium' }}>
                🔍 {searchStatus}
              </Typography>
            )}
          </Box>

          <Grid container spacing={3}>
            {tiffins.length === 0 ? (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No tiffins found matching your criteria.
                </Typography>
              </Grid>
            ) :
              tiffins.map((tiffin) => (
                <Grid item key={tiffin.id} xs={12} sm={6} md={4}>
                  <Card>
                    {tiffin.image && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={tiffin.image}
                        alt={tiffin.name}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
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
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2 }}
                        onClick={() => handleOpenOrderDialog(tiffin)}
                      >
                        Order Now
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            }
          </Grid>

          {/* Order Dialog */}
          <Dialog open={openOrderDialog} onClose={handleCloseOrderDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Order {selectedTiffin?.name}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Price: ₹{selectedTiffin?.price}
              </Typography>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                sx={{ mb: 2 }}
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
                sx={{ mb: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseOrderDialog}>Cancel</Button>
              <Button onClick={handlePlaceOrder} variant="contained" color="primary">
                Place Order (Total: ₹{(selectedTiffin?.price || 0) * orderQuantity})
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>Order History</Typography>
          <Grid container spacing={3}>
            {paginatedOrderHistory.length === 0 ? (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No orders found.
                </Typography>
              </Grid>
            ) : (
              paginatedOrderHistory.map((order) => (
                <Grid item xs={12} sm={6} md={4} key={order.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Order #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tiffin: {order.tiffin_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {order.quantity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Price: ₹{order.total_price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {order.status.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ordered on: {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
          {totalOrderHistoryPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination count={totalOrderHistoryPages} page={orderHistoryPage} onChange={handleOrderHistoryPageChange} color="primary" />
            </Box>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>Notifications</Typography>
          <Button variant="outlined" color="error" onClick={clearNotifications} sx={{ mb: 2 }}>
            Clear Notifications
          </Button>
          {notifications.length === 0 ? (
            <Typography color="text.secondary">No notifications.</Typography>
          ) : (
            notifications.map((notif) => (
              <Box key={notif.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2, background: notif.read ? '#fafafa' : '#e3f2fd' }}>
                <div>{notif.message}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{new Date(notif.timestamp).toLocaleString()}</div>
              </Box>
            ))
          )}
        </Box>
      )}
    </Container>
  );
};

export default CustomerDashboard;