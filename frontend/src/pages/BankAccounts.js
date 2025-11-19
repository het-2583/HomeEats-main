import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8000/api';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
};

export default function BankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    is_primary: true,
  });
  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const load = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/bank-accounts/`, { headers });
      setAccounts(normalizeList(data));
    } catch {
      toast.error('Failed to load bank accounts');
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/bank-accounts/`, form, { headers });
      toast.success('Bank account added');
      setForm({ account_holder_name: '', bank_name: '', account_number: '', ifsc_code: '', is_primary: true });
      load();
    } catch (e) {
      toast.error('Failed to add bank account');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Add Bank Account</Typography>
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="Account Holder Name" name="account_holder_name" value={form.account_holder_name} onChange={onChange} />
          <TextField label="Bank Name" name="bank_name" value={form.bank_name} onChange={onChange} />
          <TextField label="Account Number" name="account_number" value={form.account_number} onChange={onChange} />
          <TextField label="IFSC Code" name="ifsc_code" value={form.ifsc_code} onChange={onChange} />
          <FormControlLabel control={<Checkbox name="is_primary" checked={form.is_primary} onChange={onChange} />} label="Set as primary" />
          <Box />
          <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained">Save</Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>My Bank Accounts</Typography>
        <List>
          {accounts.map((a) => (
            <React.Fragment key={a.id}>
              <ListItem>
                <ListItemText primary={`${a.bank_name} ••••${String(a.account_number).slice(-4)} ${a.is_primary ? '(Primary)' : ''}`} secondary={`${a.account_holder_name} • IFSC: ${a.ifsc_code}`} />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
          {accounts.length === 0 && <Typography color="text.secondary">No bank accounts</Typography>}
        </List>
      </Paper>
    </Container>
  );
}


