import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PurchasePage.css';
import axios from 'axios';
import { 
    Stepper, 
    Step, 
    StepLabel, 
    Button, 
    Box, 
    Typography, 
    FormLabel,
    Grid2,
    OutlinedInput,
    Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import SimCardRoundedIcon from '@mui/icons-material/SimCardRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';


const FormGrid = styled(Grid2)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const PaymentContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  width: '100%',
  height: 375,
  padding: theme.spacing(3),
  borderRadius: `calc(${theme.shape.borderRadius}px + 4px)`,
  border: '1px solid ',
  borderColor: (theme.vars || theme).palette.divider,
  background:
    'linear-gradient(to bottom right, hsla(220, 35%, 97%, 0.3) 25%, hsla(220, 20%, 88%, 0.3) 100%)',
  boxShadow: '0px 4px 8px hsla(210, 0%, 0%, 0.05)',
  [theme.breakpoints.up('xs')]: {
    height: 300,
  },
  [theme.breakpoints.up('sm')]: {
    height: 350,
  },
  ...theme.applyStyles('dark', {
    background:
      'linear-gradient(to right bottom, hsla(220, 30%, 6%, 0.2) 25%, hsla(220, 20%, 25%, 0.2) 100%)',
    boxShadow: '0px 4px 8px hsl(220, 35%, 0%)',
  }),
}));

const UnifiedPurchasePage = () => {

  const steps = ['Shipping address', 'Payment details', 'Review your order'];

  // shipping addres form
  const [shippingAddr, setShippingAddr] = useState({
    fullName: '',
    phoneNum: '',
    address: '',
    country: '',
    postalCode: ''
  });

  const [cardInfo, setCardInfo] = useState({
    cardName: '',
    cardNum: '',
    exprDate: '', // MM/YY format
    cvv: '' // 3-digit format
  });

  const [cartItems, setCartItems] = useState([]);
  const [productTotal, setProductTotal] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [shippingFee] = useState(20); // Flat shipping fee

  const [showAddress, setShowAddress] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const Swal = require('sweetalert2');

  useEffect(() => {
      const fetchCart = async () => {
          const sessionId = localStorage.getItem('sessionId');
          if (!sessionId) {
              console.error('Session ID is required');
              return;
          }

          const userId = localStorage.getItem("user");

          try {
              const response = await axios.get('/api/cart/get', {
                  params: { sessionId, userId},
              });
              if (response.status === 200) {
                  const items = response.data.items;
                  setCartItems(items);

                  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                  setProductTotal(total.toFixed(2));
                  setOrderTotal((total + shippingFee).toFixed(2));
              }
          } catch (error) {
              console.error('Error fetching cart:', error);
          }
      };

      fetchCart();
  }, []);


  // address change handler
  // set the form fields according to enter info
  const handleAddressChange = (e) => {
    const { name, value } = e.target;

        // Allow empty input or match regex
        if (name === 'fullName' && !/^[A-Za-z\s]*$/.test(value)) return;
        else if (name === 'phoneNum' && !/^\d{0,11}$/.test(value)) return;
        else if (name === 'country' && !/^[A-Za-z\s]*$/.test(value)) return;
        else if (name === 'postalCode' && !/^\d*$/.test(value)) return;

    setShippingAddr({
      ...shippingAddr,
      [name]: value,
    });

  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;

    // Field-specific validation
    if (name === 'exprDate') {
        if (!/^(\d{0,2})\/?(\d{0,2})$/.test(value)) return;
    } else if (name === 'cvv') {
        if (!/^\d{0,3}$/.test(value)) return;
    }

    setCardInfo({
        ...cardInfo,
        [name]: value,
    });
  };

  const [activeStep, setActiveStep] = React.useState(0);
  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const payment = [
    { label: 'Card holder:', value: cardInfo.cardName },
    { label: 'Card number:', value: cardInfo.cardNum },
    { label: 'Expiration date:', value: cardInfo.exprDate },
  ];

  const handleCompletePayment = async () => {
    const userId = localStorage.getItem("user");
    console.log("User ID:", userId);
    console.log("Cart Items:", cartItems);
    console.log("Shipping Address:", shippingAddr);

    if (!userId) {
        
        //alert("You must be logged in to complete the purchase.");
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "You must be logged in to complete the purchase!"
        });
        return;
    }

    // Validate address
    const isAddressValid =
        shippingAddr.fullName.trim().length > 0 &&
        /^\d{10,15}$/.test(shippingAddr.phoneNum) && // Accept 10-15 digit phone numbers
        shippingAddr.address.trim().length > 0 &&
        shippingAddr.country.trim().length > 0 &&
        shippingAddr.postalCode.trim().length > 0;

    // Validate payment
    const isPaymentValid =
        cardInfo.cardName.trim().length > 0 &&
        /^\d{16}$/.test(cardInfo.cardNum) && // Accept exactly 16 digits for card number
        /^\d{2}\/\d{2}$/.test(cardInfo.exprDate) && // Match MM/YY format
        /^\d{3}$/.test(cardInfo.cvv); // Match 3-digit CVV

    console.log(isAddressValid);
    console.log(isPaymentValid);
    if (!isAddressValid || !isPaymentValid) {
        //alert("Please complete all required fields in Address and Payment Information.");
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please complete all required fields in Address and Payment Information!"
        });
        return;
    }

    setShowModal(true);
    setModalMessage("Processing order...");
    setIsProcessing(true);

    try {
        
      // Confirm payment and send shipping address
      await axios.post("/api/purchases/confirm-payment", {
          userId,
          products: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity, // This is inside the map and works properly
          })),
          shippingAddress: shippingAddr, // Pass the address to the server
      });

        setModalMessage("Payment completed successfully.");
        setTimeout(() => {
          handleNext();
        }, 3000);
    } catch (error) {
        console.error("Error during payment processing:", error.response || error);
        setModalMessage("Error during payment processing.");
    } finally {
        setIsProcessing(false);
    }
  };

  // Content for each step
  const getStepContent = (step) => {
    switch (step) {
    case 0:
        return (
        <Box>
            <Grid2 container spacing={3}>
              <FormGrid size={{ xs: 12 }}>
                <FormLabel htmlFor="fullName" required>
                  Full Name
                </FormLabel>
                <OutlinedInput
                    name="fullName"
                    required
                    placeholder="Full Name"
                    value={shippingAddr.fullName}
                    onChange={handleAddressChange}
                    fullWidth
                    size="small"
                    sx={{ marginBottom: 2 }}
                />
              </FormGrid>
              <FormGrid size={{ xs: 6 }}>
                <FormLabel htmlFor="phoneNum" required>
                  Phone Number
                </FormLabel>
                <OutlinedInput
                    name="phoneNum"
                    required
                    placeholder="Phone Number"
                    value={shippingAddr.phoneNum}
                    onChange={handleAddressChange}
                    fullWidth
                    size="small"
                    sx={{ marginBottom: 2 }}
                />
              </FormGrid>
              <FormGrid size={{ xs: 12 }}>
                <FormLabel htmlFor="address" required>
                  Address
                </FormLabel>
                <OutlinedInput
                    name="address"
                    required
                    placeholder="Address"
                    value={shippingAddr.address}
                    onChange={handleAddressChange}
                    fullWidth
                    size="small"
                    sx={{ marginBottom: 2 }}
                  />
              </FormGrid>
              <FormGrid size={{ xs: 6 }}>
                <FormLabel htmlFor="country" required>
                  Country
                </FormLabel>
                <OutlinedInput
                  name="country"
                  required
                  placeholder="Country"
                  value={shippingAddr.country}
                  onChange={handleAddressChange}
                  fullWidth
                  size="small"
                  sx={{ marginBottom: 2 }}
                />
              </FormGrid>
              <FormGrid size={{ xs: 6 }}>
                <FormLabel htmlFor="postalCode" required>
                  Postal Code
                </FormLabel>
                <OutlinedInput
                  name="postalCode"
                  required
                  placeholder="Postal Code"
                  value={shippingAddr.postalCode}
                  onChange={handleAddressChange}
                  fullWidth
                  size="small"
                  sx={{ marginBottom: 2, marginLeft: 2}}
                />
              </FormGrid>
          </Grid2>
        </Box>
        );
    case 1:
        return (
        <Box>
            <Stack spacing={{ xs: 3, sm: 6 }} useFlexGap>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2">Credit Card</Typography>
                <PaymentContainer>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">Credit Card Details</Typography>
                    <CreditCardRoundedIcon sx={{ color: 'text.secondary' }} />
                  </Box>
                  <SimCardRoundedIcon
                    sx={{
                      fontSize: { xs: 48, sm: 56 },
                      transform: 'rotate(90deg)',
                      color: 'text.secondary',
                    }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      gap: 2,
                    }}
                  >
                    <FormGrid sx={{ flexGrow: 1 }}>
                      <FormLabel htmlFor="card-number" required>
                        Card Number
                      </FormLabel>
                      <OutlinedInput
                        name="cardNum"
                        placeholder="0000 0000 0000 0000"
                        required
                        size="small"
                        value={cardInfo.cardNum}
                        onChange={handlePaymentChange}
                      />
                    </FormGrid>
                    <FormGrid sx={{ maxWidth: '20%' }}>
                      <FormLabel htmlFor="cvv" required>
                        CVV
                      </FormLabel>
                      <OutlinedInput
                        name="cvv"
                        placeholder="123"
                        required
                        size="small"
                        value={cardInfo.cvv}
                        onChange={handlePaymentChange}
                      />
                    </FormGrid>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormGrid sx={{ flexGrow: 1 }}>
                      <FormLabel htmlFor="card-name" required>
                        Name on Card
                      </FormLabel>
                      <OutlinedInput
                        name="cardName"
                        placeholder="Cardholder Name"
                        required
                        size="small"
                        value={cardInfo.cardName}
                        onChange={handlePaymentChange}
                      />
                    </FormGrid>
                    <FormGrid sx={{ flexGrow: 1 }}>
                      <FormLabel htmlFor="card-expiration" required>
                        Expiration Date
                      </FormLabel>
                      <OutlinedInput
                        name ="exprDate"
                        placeholder="MM/YY"
                        required
                        size="small"
                        value={cardInfo.exprDate}
                        onChange={handlePaymentChange}
                      />
                    </FormGrid>
                  </Box>
                </PaymentContainer>
              </Box>
            </Stack>
        </Box>
        );
      case 2:
        return(
          <Stack spacing={2}>
            <List disablePadding>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Products"/>
                <Typography variant="body2">${productTotal}</Typography>
              </ListItem>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Shipping"/>
                <Typography variant="body2">${shippingFee.toFixed(2)}</Typography>
              </ListItem>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Total" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ${orderTotal}
                </Typography>
              </ListItem>
            </List>
            <Divider />
            <Stack
              direction="column"
              divider={<Divider flexItem />}
              spacing={2}
              sx={{ my: 2 }}
            >
              <div>
                <Typography variant="subtitle2" gutterBottom>
                  Shipment details
                </Typography>
                <Typography gutterBottom>{shippingAddr.fullName}</Typography>
                <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                  {shippingAddr.phoneNum}
                </Typography>
                <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                  {shippingAddr.address}, {shippingAddr.postalCode}, {shippingAddr.country} 
                </Typography>
              </div>
              <div>
                <Typography variant="subtitle2" gutterBottom>
                  Payment details
                </Typography>
                <Grid2 container>
                  {payment.map((payment) => (
                    <React.Fragment key={payment.label}>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{ width: '100%', mb: 1 }}
                      >
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                          {payment.label}
                        </Typography>
                        <Typography variant="body2">{payment.value}</Typography>
                      </Stack>
                    </React.Fragment>
                  ))}
                </Grid2>
              </div>
            </Stack>
          </Stack>
        );
    default:
        return <Typography>Unknown step</Typography>;
    }
  };

return (
  <>
  <CssBaseline />
  <Grid2
    container
    sx={{
      height: {
        xs: '100%',
        sm: 'calc(100dvh - var(--template-frame-height, 0px))',
      },
      mt: {
        xs: 4,
        sm: 0,
      },
    }}
  >
    <Grid2
      size={{ xs: 12, sm: 5, lg: 4 }}
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        backgroundColor: '#f5f6fa',
        borderRight: { sm: 'none', md: '1px solid' },
        borderColor: { sm: 'none', md: 'divider' },
        alignItems: 'start',
        pt: 16,
        px: 10,
        gap: 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          width: '100%',
          maxWidth: 500, 
        }}
      >
        <React.Fragment>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Total
          </Typography>
          <Typography variant="h4" gutterBottom>
            ${orderTotal}
          </Typography>
          <List disablePadding>
            {cartItems.map((item) => (
              <ListItem key={item.productId} sx={{ py: 1, px: 0 }}>
                <ListItemText
                  sx={{ mr: 2 }}
                  primary={item.name} 
                  secondary= {`x${item.quantity}`}
                />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  ${item.price* item.quantity}
                </Typography>
              </ListItem>
            ))}
            <ListItem >
              <ListItemText
                sx={{ mr: 2 }}
                primary={`Shipping`} 
              />
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                ${shippingFee}
              </Typography>
            </ListItem>
          </List>
        </React.Fragment>
      </Box>
    </Grid2>
    <Grid2
      size={{ sm: 12, md: 7, lg: 8 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        width: '100%',
        backgroundColor: { xs: 'transparent', sm: 'background.default' },
        alignItems: 'start',
        pt: { xs: 0, sm: 16 },
        px: { xs: 2, sm: 10 },
        gap: { xs: 4, md: 8 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: { sm: 'space-between', md: 'flex-end' },
          alignItems: 'center',
          width: '100%',
          maxWidth: { sm: '100%', md: 600 },
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexGrow: 1,
          }}
        >
          <Stepper
            id="desktop-stepper"
            activeStep={activeStep}
            sx={{ width: '100%', height: 40 }}
          >
            {steps.map((label) => (
              <Step
                sx={{ ':first-child': { pl: 0 }, ':last-child': { pr: 0 } }}
                key={label}
              >
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          width: '100%',
          maxWidth: { sm: '100%', md: 600 },
          maxHeight: '720px',
          gap: { xs: 5, md: 'none' },
        }}
      >
        <Stepper
          id="mobile-stepper"
          activeStep={activeStep}
          alternativeLabel
          sx={{ display: { sm: 'flex', md: 'none' } }}
        >
          {steps.map((label) => (
            <Step
              sx={{
                ':first-child': { pl: 0 },
                ':last-child': { pr: 0 },
                '& .MuiStepConnector-root': { top: { xs: 6, sm: 12 } },
              }}
              key={label}
            >
              <StepLabel
                sx={{ '.MuiStepLabel-labelContainer': { maxWidth: '70px' } }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        {activeStep === steps.length ? (
          <Stack spacing={2} useFlexGap>
            <Typography variant="h1">📦</Typography>
            <Typography variant="h5">Thank you for your order!</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Your order has been successfully placed. Please check the status of your order on the order tracking page.
            </Typography>
            <Button
              variant="contained"
              sx={{ alignSelf: 'start', width: { xs: '100%', sm: 'auto' } }}
              onClick={() => navigate("/orders")}
            >
              Go to order tracking page
            </Button>
          </Stack>
        ) : (
          <React.Fragment>
            {getStepContent(activeStep)}
            <Box
              sx={[
                {
                  display: 'flex',
                  flexDirection: { xs: 'column-reverse', sm: 'row' },
                  alignItems: 'end',
                  flexGrow: 1,
                  gap: 1,
                  pb: { xs: 12, sm: 0 },
                  mt: { xs: 2, sm: 0 },
                  mb: '60px',
                },
                activeStep !== 0
                  ? { justifyContent: 'space-between' }
                  : { justifyContent: 'flex-end' },
              ]}
            >
              {activeStep !== 0 && (
                <Button
                  startIcon={<ChevronLeftRoundedIcon />}
                  onClick={handleBack}
                  variant="text"
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Previous
                </Button>
              )}
              {activeStep !== 0 && (
                <Button
                  startIcon={<ChevronLeftRoundedIcon />}
                  onClick={handleBack}
                  variant="outlined"
                  fullWidth
                  sx={{ display: { xs: 'flex', sm: 'none' } }}
                >
                  Previous
                </Button>
              )}
              <Button
                variant="contained"
                endIcon={<ChevronRightRoundedIcon />}
                onClick={activeStep === steps.length - 1 ? handleCompletePayment : handleNext}
                sx={{ width: { xs: '100%', sm: 'fit-content' } }}
              >
                {activeStep === steps.length - 1 ? 'Place order' : 'Next'}
              </Button>
            </Box>
          </React.Fragment>
        )}
      </Box>
    </Grid2>
  </Grid2>
  </>
  );
};

export default UnifiedPurchasePage;