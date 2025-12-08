import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  CardMedia,
  Pagination,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNotifications } from '../contexts/NotificationContext';
import { useSelector } from 'react-redux';

const API_URL = 'http://localhost:8000/api';

const OwnerDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [tiffins, setTiffins] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTiffin, setEditingTiffin] = useState(null);
  const [tiffinForm, setTiffinForm] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const { addNotification, notifications } = useNotifications();

  // Define these at the top so they're always in scope
  const ownerTiffinIds = tiffins.map(t => t.id);
  const activeOrdersAll = orders.filter(
    order => ownerTiffinIds.includes(order.tiffin) && ['pending', 'confirmed', 'preparing'].includes(order.status)
  );
  const totalActivePages = Math.max(1, Math.ceil(activeOrdersAll.length / pageSize));

  const fetchData = async (pageNum = page) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // First get user data
      const userResponse = await axios.get(`${API_URL}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!userResponse.data.tiffin_owner) {
        setError('User is not a tiffin owner');
        return;
      }

      // No need to store owner_id in localStorage anymore

      const userPincode = userResponse.data.tiffin_owner.business_pincode;
      console.log('User pincode:', userPincode); // Debug log
      
      // Fetch tiffins
      const tiffinsResponse = await axios.get(`${API_URL}/tiffins/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { pincode: userPincode }
      });
      console.log('Tiffins response:', tiffinsResponse.data); // Debug log
      setTiffins(tiffinsResponse.data.results);

      // Fetch all pages of orders
      let allOrders = [];
      let nextUrl = `${API_URL}/orders/`;
      while (nextUrl) {
        const ordersResponse = await axios.get(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        allOrders = allOrders.concat(ordersResponse.data.results);
        nextUrl = ordersResponse.data.next;
      }
      setOrders(allOrders);
      setTotalPages(Math.ceil(allOrders.length / pageSize));
    } catch (error) {
      console.error('Error fetching data:', error); // Debug log
      setError(error.response?.data?.detail || 'Failed to fetch dashboard data');
      toast.error(error.response?.data?.detail || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
    const interval = setInterval(() => fetchData(page), 5000);
    return () => clearInterval(interval);
  }, [page]);

  useEffect(() => {
    if (page > totalActivePages) setPage(1);
  }, [totalActivePages]);

  useEffect(() => {
    // For every active order, if there is no notification for it, add one
    activeOrdersAll.forEach(order => {
      const notifMsg = `You received a new order for your tiffin: ${order.tiffin_name} (Order #${order.id})`;
      const alreadyNotified = notifications.some(n => n.message === notifMsg);
      if (!alreadyNotified) {
        addNotification(notifMsg);
        console.log('Adding notification for order:', order.id, order.tiffin_name);
      }
    });
  }, [activeOrdersAll, notifications, addNotification]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_URL}/orders/${orderId}/update_status/`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Order status updated successfully!');
      fetchData(page);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleOpenDialog = (tiffin = null) => {
    setEditingTiffin(tiffin);
    if (tiffin) {
      setTiffinForm({
        name: tiffin.name,
        description: tiffin.description,
        price: tiffin.price,
        is_available: tiffin.is_available,
        image: null,
      });
      setImagePreview(tiffin.image);
    } else {
      setTiffinForm({
        name: '',
        description: '',
        price: '',
        is_available: true,
        image: null,
      });
      setImagePreview(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTiffin(null);
    setTiffinForm({
      name: '',
      description: '',
      price: '',
      is_available: true,
      image: null,
    });
    setImagePreview(null);
  };

  const handleTiffinFormChange = (e) => {
    const { name, value, checked, type, files } = e.target;
    if (type === 'file' && files[0]) {
      setTiffinForm((prev) => ({
        ...prev,
        image: files[0],
      }));
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setTiffinForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmitTiffin = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      Object.keys(tiffinForm).forEach(key => {
        if (tiffinForm[key] !== null) {
          formData.append(key, tiffinForm[key]);
        }
      });

      if (editingTiffin) {
        await axios.put(
          `${API_URL}/tiffins/${editingTiffin.id}/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Tiffin updated successfully!');
      } else {
        await axios.post(
          `${API_URL}/tiffins/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Tiffin added successfully!');
      }
      fetchData(page);
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save tiffin');
    }
  };

  const handleDeleteTiffin = async (tiffinId) => {
    if (window.confirm('Are you sure you want to delete this tiffin?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`${API_URL}/tiffins/${tiffinId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Tiffin deleted successfully!');
        fetchData(page);
      } catch (error) {
        toast.error('Failed to delete tiffin');
      }
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Debug: log notifications context and activeOrdersAll every render
  console.log('OwnerDashboard notifications context:', notifications);
  console.log('OwnerDashboard activeOrdersAll:', activeOrdersAll);

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

  // Pagination for active orders
  const paginatedActiveOrders = activeOrdersAll.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Owner Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="My Tiffins" />
          <Tab label="Active Orders" />
          <Tab label="Order History" />
          <Tab label="Notifications" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mb: 3 }}
          >
            Add New Tiffin
          </Button>
          <Grid container spacing={3}>
            {tiffins.length === 0 ? (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No tiffins found. Click 'Add New Tiffin' to get started!
                </Typography>
              </Grid>
            ) : (
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
                      <Typography
                        variant="body2"
                        color={tiffin.is_available ? 'success.main' : 'error.main'}
                      >
                        {tiffin.is_available ? 'Available' : 'Not Available'}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(tiffin)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteTiffin(tiffin.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      )}

      {tabValue === 1 && (
        <>
          <Grid container spacing={3}>
            {paginatedActiveOrders.length === 0 ? (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No active orders found.
                </Typography>
              </Grid>
            ) : (
              paginatedActiveOrders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Order #{order.id}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        Tiffin: {order.tiffin_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Customer: {order.customer_name}
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
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          disabled={order.status === 'preparing'}
                          sx={{ mr: 1 }}
                        >
                          Mark as Preparing
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleStatusChange(order.id, 'ready_for_delivery')}
                          disabled={order.status === 'ready_for_delivery'}
                        >
                          Mark as Ready
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
          {totalActivePages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination count={totalActivePages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {orders.filter(
            order => ownerTiffinIds.includes(order.tiffin) && ['ready_for_delivery', 'picked_up', 'delivered', 'cancelled'].includes(order.status)
          ).length === 0 ? (
            <Grid item xs={12}>
              <Typography align="center" color="text.secondary">
                No order history found.
              </Typography>
            </Grid>
          ) : (
            orders.filter(
              order => ownerTiffinIds.includes(order.tiffin) && ['ready_for_delivery', 'picked_up', 'delivered', 'cancelled'].includes(order.status)
            ).map((order) => (
              <Grid item xs={12} key={order.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Order #{order.id}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Tiffin: {order.tiffin_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer: {order.customer_name}
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
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {tabValue === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom>Notifications</Typography>
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

      {/* Tiffin Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTiffin ? 'Edit Tiffin' : 'Add New Tiffin'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Tiffin Name"
            type="text"
            fullWidth
            variant="standard"
            value={tiffinForm.name}
            onChange={handleTiffinFormChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="standard"
            value={tiffinForm.description}
            onChange={handleTiffinFormChange}
          />
          <TextField
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            variant="standard"
            value={tiffinForm.price}
            onChange={handleTiffinFormChange}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={tiffinForm.is_available}
                onChange={handleTiffinFormChange}
                name="is_available"
              />
            }
            label="Available for Order"
          />
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*"
              type="file"
              id="tiffin-image"
              name="image"
              onChange={handleTiffinFormChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="tiffin-image">
              <Button variant="outlined" component="span">
                Upload Image
              </Button>
            </label>
            {imagePreview && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmitTiffin} variant="contained">
            {editingTiffin ? 'Save Changes' : 'Add Tiffin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OwnerDashboard;