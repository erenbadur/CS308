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
  Button,
  Skeleton
} from '@mui/material';
import { ExpandMore, ExpandLess, LocalShipping } from '@mui/icons-material';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SHIPPING_FEE = 20;

const handleInvoiceDownload = async (invoiceId, orderId) => {
  try {
    const response = await axios({
      url: `/api/track/download/${invoiceId}`,
      method: 'GET',
      responseType: 'blob', // Important for handling binary data
    });

    // Create a URL for the file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${orderId}.pdf`); // Provide a meaningful filename
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error downloading invoice:', error);
    alert('Failed to download the invoice. Please try again later.');
  }
};

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

const handleReturn = async (productId, deliveryId, quantity, orderId) => {
  const result = await Swal.fire({
    title: 'Return Item',
    text: 'Are you sure you want to return this item?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, return it',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch('/api/create-refund/create-refund-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryId,
          productId,
          quantity,
          userId: localStorage.getItem('user'),
        })
      });

      await response.json();

      if (response.ok) {

        const patchResponse = await fetch(`/api/purchases/update-refundable/${orderId}/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refundable: 'return_req',
          }),
        });

        await patchResponse.json();
        if (patchResponse.ok) {
          // Show success message
          await Swal.fire({
            icon: 'success',
            title: 'Return Initiated',
            text: 'Your return request has been submitted successfully',
            timer: 2000,
            showConfirmButton: false
          });

        } else {
          console.error("couldn't update refundable attribute")
        }
      }
    } catch (error) {
      console.error('Return request failed:', error);
    }
  }
};

const isCancellable = (order) => {
  return order.deliveryDetails?.status?.toLowerCase() === 'processing';
};

const handleCancel = async (deliveryId, orderId) => {
  const result = await Swal.fire({
    title: 'Cancel Order',
    text: 'Are you sure you want to cancel this order?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, cancel order',
    cancelButtonText: 'No'
  });

  if (result.isConfirmed) {
    try {
      // Call the cancel endpoint
      const response = await fetch(`/api/track/cancel-order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryId,
          orderId,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      // Show success message
      await Swal.fire({
        title: 'Order Cancelled',
        text: `Your order has been cancelled.`,
        icon: 'success'
      });

    } catch (error) {
      // Show error message
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Something went wrong while cancelling the order',
        icon: 'error'
      });
    }
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
      case 'in-transit':
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
              {isCancellable(order) &&(
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => 
                    handleCancel(
                      order.deliveryDetails.deliveryId,
                      order._id
                  )}
                >
                  Cancel Order
                </Button>
              )}
            </Box>
          </Box>
          <Box textAlign="right">
            <Typography variant="h6" color="primary">
              ${order.invoiceDetails?.totalAmount+ SHIPPING_FEE}
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
            <Typography>Your invoice is ready:</Typography>
              <Button
                onClick={() => 
                  handleInvoiceDownload(
                    order.invoiceDetails.invoiceId, 
                    order._id)}
              >
                Download Invoice
              </Button>
            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Products
            </Typography>
            <Grid container spacing={2}>
              {order.products.map((product, index) => {
                const eligible = isReturnEligible(order);
                const currentReturnStatus = product.refundable;
                console.log("this orderId:", order._id);
                console.log("this prodcut is eligible:",eligible, "and returnable:", currentReturnStatus);
                
                return (
                  <Grid item xs={12} key={index}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box flexGrow={1}>
                          <Typography variant="subtitle1">{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {product.quantity}
                          </Typography>
                          {eligible && currentReturnStatus === 'no_return' ? (
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() =>
                                handleReturn(
                                  product.productId,
                                  order.deliveryDetails.deliveryId,
                                  product.quantity,
                                  order._id,
                                )
                              }
                              sx={{ mt: 1 }}
                            >
                              Return
                            </Button>
                          ) : currentReturnStatus === 'return_req' ? (
                            <Typography color="warning" sx={{ mt: 1 }}>
                              Item waits approval for refund.
                            </Typography>
                          ) : currentReturnStatus === 'approved' ? (
                            <Typography color="success" sx={{ mt: 1 }}>
                              Refund Approved.
                            </Typography>
                          ) : currentReturnStatus === 'rejected' ? (
                            <Typography color="error" sx={{ mt: 1 }}>
                              Refund Rejected.
                            </Typography>
                          ) : null}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1">
                            ${product.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Product Total: ${(product.price * product.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Shipping Fee:</Typography>
              <Typography variant="subtitle1">
                ${SHIPPING_FEE}
              </Typography>
            </Box>
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
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigateToMain = () => {
    navigate('/');
  };

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
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const contentStyles = {
    backgroundColor: 'white',
    borderRadius: 2,
    boxShadow: 1,
    p: 4,
    my: 4,
    height: '90vh',
    width: '100vh',
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
        <Container maxWidth="lg" sx={contentStyles}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} variant="rectangular" height={100} sx={{ mb: 2 }} />
          ))}
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth="lg" sx={contentStyles}>
          <button onClick={navigateToMain} className="back-arrow" title="Go Back">
            ←
          </button>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={contentStyles}>
    <button onClick={navigateToMain} className="back-arrow" title="Go Back">
    ←
    </button>
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