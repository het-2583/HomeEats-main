import React, { useEffect, useState } from 'react';
import { Container, TextField, Button, Box, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8000/api';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    address: '',
    pincode: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        pincode: user.pincode || '',
      });
    }
  }, [user]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.patch(`${API_URL}/users/update_me/`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>My Profile</Typography>
        <Box component="form" onSubmit={onSubmit}>
          <TextField fullWidth margin="normal" label="Username" name="username" value={form.username} onChange={onChange} />
          <TextField fullWidth margin="normal" label="Email" name="email" value={form.email} onChange={onChange} />
          <TextField fullWidth margin="normal" label="Phone" name="phone_number" value={form.phone_number} onChange={onChange} />
          <TextField fullWidth margin="normal" label="Address" name="address" value={form.address} onChange={onChange} />
          <TextField fullWidth margin="normal" label="Pincode" name="pincode" value={form.pincode} onChange={onChange} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button type="submit" variant="contained">Save</Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}


