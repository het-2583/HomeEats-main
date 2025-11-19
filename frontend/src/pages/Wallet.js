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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8000/api';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
};

export default function Wallet() {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [amount, setAmount] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankId, setBankId] = useState('');

  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const load = async () => {
    try {
      const [w, tx, ba] = await Promise.all([
        axios.get(`${API_URL}/wallet/`, { headers }),
        axios.get(`${API_URL}/wallet/transactions/`, { headers }),
        axios.get(`${API_URL}/bank-accounts/`, { headers }),
      ]);
      setWallet({ ...w.data, transactions: tx.data });
      setBankAccounts(normalizeList(ba.data));
    } catch (e) {
      toast.error('Failed to load wallet');
    }
  };

  useEffect(() => { load(); }, []);

  const deposit = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/wallet/deposit/`, { amount }, { headers });
      toast.success('Deposit successful');
      setAmount('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Deposit failed');
    }
  };

  const withdraw = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/wallet/withdraw/`, { amount, bank_account_id: bankId || undefined }, { headers });
      toast.success('Withdraw successful');
    } catch (e) {
      toast.error(e.response?.data?.message || 'The withdrawal facility is temporarily stopped.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Wallet Balance: ₹{Number(wallet.balance).toFixed(2)}</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button variant="contained" onClick={deposit}>Add Money</Button>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="bank-label">Bank Account</InputLabel>
            <Select labelId="bank-label" label="Bank Account" value={bankId} onChange={(e) => setBankId(e.target.value)}>
              <MenuItem value=""><em>Primary</em></MenuItem>
              {bankAccounts.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.bank_name} ••••{String(b.account_number).slice(-4)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={withdraw}>Withdraw to Bank</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Recent Transactions</Typography>
        <List>
          {wallet.transactions.map((t) => (
            <React.Fragment key={t.id}>
              <ListItem>
                <ListItemText
                  primary={`${t.txn_type} • ₹${Number(t.amount).toFixed(2)}`}
                  secondary={new Date(t.created_at).toLocaleString()}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
          {wallet.transactions.length === 0 && <Typography color="text.secondary">No transactions yet</Typography>}
        </List>
      </Paper>
    </Container>
  );
}


