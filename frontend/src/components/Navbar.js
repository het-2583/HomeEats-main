import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Restaurant,
  LocalShipping,
  Person,
  Notifications,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Badge from '@mui/material/Badge';
import { useNotifications } from '../contexts/NotificationContext';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.user_type) {
      case 'customer':
        return '/customer-dashboard';
      case 'owner':
        return '/owner-dashboard';
      case 'delivery':
        return '/delivery-dashboard';
      default:
        return '/';
    }
  };

  const getDashboardIcon = () => {
    if (!user) return <Person />;
    switch (user.user_type) {
      case 'customer':
        return <Person />;
      case 'owner':
        return <Restaurant />;
      case 'delivery':
        return <LocalShipping />;
      default:
        return <Person />;
    }
  };

  const handleNotifOpen = (event) => {
    setNotifAnchorEl(event.currentTarget);
    markAllRead();
  };

  const handleNotifClose = () => setNotifAnchorEl(null);

  return (
    <AppBar position="static">
      <Toolbar>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={logo}
            alt="HomeEats Logo"
            style={{ height: 40, marginRight: 8 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            onClick={handleNotifOpen}
            aria-label="notifications"
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {notifications.length === 0 ? (
              <MenuItem disabled>No notifications</MenuItem>
            ) : (
              notifications.map((notif) => (
                <MenuItem
                  key={notif.id}
                  sx={{ whiteSpace: 'normal', maxWidth: 300 }}
                >
                  {notif.message}
                  <br />
                  <span
                    style={{
                      fontSize: 12,
                      color: '#888',
                    }}
                  >
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </MenuItem>
              ))
            )}
          </Menu>
          {isMobile ? (
            <>
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenu}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {!isAuthenticated ? (
                  <>
                    <MenuItem
                      component={RouterLink}
                      to="/login"
                      onClick={handleClose}
                    >
                      Login
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/register"
                      onClick={handleClose}
                    >
                      Register
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem
                      component={RouterLink}
                      to={getDashboardLink()}
                      onClick={handleClose}
                    >
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {!isAuthenticated ? (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/login"
                    sx={{ mr: 1 }}
                  >
                    Login
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/register"
                    variant="outlined"
                  >
                    Register
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to={getDashboardLink()}
                    startIcon={getDashboardIcon()}
                    sx={{ mr: 1 }}
                  >
                    {user?.username || 'Dashboard'}
                  </Button>
                  <IconButton
                    color="inherit"
                    onClick={handleMenu}
                    aria-label="account menu"
                  >
                    <AccountCircle />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem
                      component={RouterLink}
                      to="/profile"
                      onClick={handleClose}
                    >
                      Profile
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/wallet"
                      onClick={handleClose}
                    >
                      Wallet
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/bank-accounts"
                      onClick={handleClose}
                    >
                      Bank Accounts
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;