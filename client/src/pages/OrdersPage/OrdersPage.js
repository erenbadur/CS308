import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Container,
  Box,
  Collapse,
  IconButton,
  Grid,
  Divider,
  Paper,
  Chip,
  Avatar,
  Button,
  Skeleton
} from '@mui/material';
import { ExpandMore, ExpandLess, LocalShipping } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const isReturnEligible = (order) => {
  if (!order.deliveryDetails?.status) return false;
  if (order.deliveryDetails.status.toLowerCase() !== 'delivered') return false;
  if (!order.purchaseDate) return false;

  const purchaseDate = new Date(order.purchaseDate);
  const currentDate = new Date();
  
  if (isNaN(purchaseDate.getTime())) return false;
  
  const daysDifference = Math.floor((currentDate - purchaseDate) / (1000 * 60 * 60 * 24));
  return daysDifference <= 30;
};

const isCancellable = (order) => {
  return order.deliveryDetails?.status?.toLowerCase() === 'processing';
};

const handleReturn = (productId) => {
  const initiateReturn = async () => {
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          userId: localStorage.getItem('user'),
          returnReason: 'customer_request'
        })
      });

      if (response.ok) {
        alert('Return request initiated successfully');
        window.location.reload();
      } else {
        alert('Failed to initiate return. Please try again.');
      }
    } catch (error) {
      console.error('Return request failed:', error);
      alert('Failed to initiate return. Please try again.');
    }
  };

  if (window.confirm('Are you sure you want to return this item?')) {
    initiateReturn();
  }
};

const handleCancel = async (orderId) => {
  if (!window.confirm('Are you sure you want to cancel this order?')) {
    return;
  }

  try {
    const response = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: localStorage.getItem('user')
      })
    });

    if (response.ok) {
      alert('Order cancelled successfully');
      window.location.reload();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to cancel order. Please try again.');
    }
  } catch (error) {
    console.error('Cancel order failed:', error);
    alert('Failed to cancel order. Please try again.');
  }
};

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'delivered':
        return 'success';
      case 'processing':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatAddress = (addressObj) => {
    if (!addressObj) return 'No address provided';
    const { fullName, phoneNum, address, country, postalCode } = addressObj;

    return (
      <Box>
        <Typography variant="body1">Name: {fullName}</Typography>
        <Typography variant="body1">
          Address: {address}, {postalCode}, {country}
        </Typography>
        <Typography variant="body1">Phone: {phoneNum}</Typography>
      </Box>
    );
  };

  return (
    <Card
      sx={{
        mb: 2,
        '&:hover': {
          boxShadow: 6,
          transition: 'box-shadow 0.3s ease-in-out'
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              Order #{order._id}
            </Typography>
            <Typography color="text.secondary">
              {formatDate(order.purchaseDate)}
            </Typography>
            <Box mt={1} display="flex" alignItems="center" gap={1}>
              {order.deliveryDetails?.status && (
                <Chip
                  icon={<LocalShipping />}
                  label={order.deliveryDetails.status}
                  color={getStatusColor(order.deliveryDetails.status)}
                />
              )}
              {isCancellable(order) && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleCancel(order._id)}
                >
                  Cancel Order
                </Button>
              )}
            </Box>
          </Box>
          <Box textAlign="right">
            <Typography variant="h6" color="primary">
              ${order.invoiceDetails?.totalAmount.toFixed(2)}
            </Typography>
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box mt={2}>
            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Products
            </Typography>
            <Grid container spacing={2}>
              {order.products.map((product, index) => {
                const eligible = isReturnEligible(order);
                console.log('Order eligibility check:', {
                  orderId: order._id,
                  status: order.deliveryDetails?.status,
                  purchaseDate: order.purchaseDate,
                  isEligible: eligible
                });

                return (
                  <Grid item xs={12} key={index}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: 'background.default' }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box flexGrow={1}>
                          <Typography variant="subtitle1">{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {product.quantity}
                          </Typography>
                          {eligible && (
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleReturn(product.id)}
                              sx={{ mt: 1 }}
                            >
                              Return
                            </Button>
                          )}
                        </Box>

                        <Box>
                          <Typography variant="subtitle1">
                            ${product.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total: ${(product.price * product.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {order.deliveryDetails && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Delivery Details
                </Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                  {formatAddress(order.deliveryDetails.deliveryAddress)}
                </Paper>
              </>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem('user');
        if (!userId) {
          setError('User not found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/track/orders/${userId}`);
        const data = await response.json();

        if (response.ok) {
          setOrders(data.orders);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to fetch orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    p: 3,
  };

  const contentStyles = {
    backgroundColor: 'white',
    borderRadius: 2,
    boxShadow: 1,
    p: 4,
    my: 4,
    height: '80vh',
    width: '100%',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px',
      '&:hover': {
        background: '#555',
      },
    },
  };

  if (loading) {
    return (
      <Box sx={containerStyles}>
        <Container maxWidth="lg" sx={contentStyles}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} variant="rectangular" height={100} sx={{ mb: 2 }} />
          ))}
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={containerStyles}>
        <Container maxWidth="lg" sx={contentStyles}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Container>
      </Box>
    );
  }

  return (
      <Container maxWidth="lg" sx={contentStyles}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Your Orders
        </Typography>
        {orders.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            No orders found
          </Typography>
        ) : (
          orders.map((order) => <OrderCard key={order._id} order={order} />)
        )}
      </Container>
  );
};

export default OrdersPage;