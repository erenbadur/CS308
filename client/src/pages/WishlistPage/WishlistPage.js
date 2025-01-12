import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  IconButton,
  CircularProgress,
  Container,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import Swal from "sweetalert2";

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      const userId = localStorage.getItem("user");
      if (!userId) {
        console.error("No user ID found in localStorage.");
        setLoading(false);
        return;
      }

      try {
        const wishlistResponse = await axios.get(`/api/wishlist/${userId}`);
        const wishlist = wishlistResponse.data.wishlist;

        const productDetails = await Promise.all(
          wishlist.map(async (item) => {
            try {
              const productResponse = await axios.get(
                `/api/products/${item.productId}`
              );
              return { ...item, productDetails: productResponse.data.product };
            } catch (err) {
              console.error(`Error fetching product ${item.productId}:`, err.message);
              return { ...item, productDetails: null };
            }
          })
        );

        setWishlistItems(productDetails);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const navigateToMain = () => {
    navigate("/");
  };

  const removeFromWishlist = async (wishlistItemId) => {
    try {
      await axios.delete(`/api/wishlist/${wishlistItemId}`);
      setWishlistItems((prevItems) =>
        prevItems.filter((item) => item._id !== wishlistItemId)
      );
      Swal.fire({
        icon: "success",
        title: "Removed",
        text: "Item removed from wishlist successfully.",
      });
    } catch (err) {
      console.error("Error removing item from wishlist:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to remove the item from wishlist.",
      });
    }
  };

  const handleAddToCart = async (product) => {
    const sessionId = localStorage.getItem("sessionId");
    const userId = localStorage.getItem("user");

    if (!sessionId) {
      Swal.fire({
        icon: "error",
        title: "Session Error",
        text: "Session ID not found. Please try again.",
      });
      return;
    }

    try {
      const response = await axios.post("/api/cart/add", {
        sessionId,
        userId,
        productId: product.productId,
        quantity: 1,
      });

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Added to Cart",
          text: `${product.name} has been added to your cart successfully.`,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to add the product to the cart.",
        });
      }
    } catch (err) {
      console.error("Error adding to cart:", err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding the product to the cart.",
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        minWidth: "100vh",
        py: 4,
      }}
    >
      <Container
        sx={{
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          minWidth: "150vh",
          minHeight: "90vh", // Minimum height to ensure consistency
          height: "auto", // Allows the container to expand with content
          padding: 4,
        }}
      >
        <Button
          onClick={navigateToMain}
          variant="outlined"
          sx={{ marginBottom: 3 }}
        >
          Go Back
        </Button>
        <Typography variant="h4" textAlign="center" gutterBottom>
          Your Wishlist
        </Typography>
        {wishlistItems.length === 0 ? (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Your wishlist is currently empty.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {wishlistItems.map((item, index) => {
              const product = item.productDetails;
              if (!product) return null;

              return (
                <Grid item key={index} xs={12}>
                  <Card
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      padding: 2,
                    }}
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        width: 150,
                        height: 150,
                        objectFit: "contain",
                      }}
                      image={product.imageUrl}
                      alt={product.name}
                    />
                    <CardContent sx={{ flex: 1, paddingLeft: 3 }}>
                      <Typography variant="h6" noWrap>
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          WebkitLineClamp: 2,
                          opacity: 0.8,
                        }}
                      >
                        {product.description}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ marginTop: 1 }}>
                        Price: ${product.price}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Rating: {product.averageRating || "Not rated yet"}
                      </Typography>
                    </CardContent>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleAddToCart(product)}
                      >
                        <AddShoppingCartIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => removeFromWishlist(item._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default WishlistPage;
