import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  CircularProgress,
} from '@mui/material';
import { login, fetchUserProfile } from '../redux/slices/authSlice';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const result = await dispatch(login(values));
        if (result.error) {
          return; // Stop if login failed
        }
        
        // Fetch user profile to get user type
        const profileResult = await dispatch(fetchUserProfile());
        if (profileResult.error) {
          return; // Stop if profile fetch failed
        }

        // Check if there's a redirect path in the location state
        const redirectTo = location.state?.redirectTo;
        if (redirectTo) {
          navigate(redirectTo);
          return;
        }

        // If no redirect path, navigate based on user type
        switch (profileResult.payload.user_type) {
          case 'customer':
            navigate('/customer-dashboard');
            break;
          case 'owner':
            navigate('/owner-dashboard');
            break;
          case 'delivery':
            navigate('/delivery-dashboard');
            break;
          default:
            navigate('/');
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    },
  });

  // OTP login flow removed per request.

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Typography component="h1" variant="h4" align="center" gutterBottom>Login to Home Eats</Typography>

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 3 }}
          >
            <TextField
              fullWidth
              id="username"
              name="username"
              label="Username"
              value={formik.values.username}
              onChange={formik.handleChange}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              margin="normal"
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
            />

            <Button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </Button>

            {error && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {error.detail || 'Login failed'}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  state={location.state}
                >
                  Register here
                </Link>
              </Typography>
            </Box>
          </Box>

          
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;