// src/mainpage.js
import React, { useEffect } from 'react';
import './mainpage.css';





const MainPage = () => {
    useEffect(() => {
        const handleScroll = () => {
            const backToTopBtn = document.getElementById("backToTopBtn");
            if (window.scrollY > 100) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <div>
            <div id="home-section"></div>

            {/* Navbar */}
            <div className="navbar">
                <div className="nav-links">
                    <a href="#home-section" className="nav-link">Home</a>
                    <a href="#popular-section" className="nav-link">Popular</a>
                    <a href="#about-section" className="nav-link">About</a>
                </div>
                <div className="nav-items">
                    <div className="category-dropdown">
                        <button>Product Category</button>
                        <div className="category-dropdown-content">
                            <a href="phone.html" className="category-card">
                                <img src="resimler/pone_new.webp" alt="Phone" />
                                <p>Phone</p>
                            </a>
                            <a href="tv.html" className="category-card">
                                <img src="resimler/tv_new.webp" alt="TV" />
                                <p>TV</p>
                            </a>
                            <a href="tablet.html" className="category-card">
                                <img src="resimler/tablet_new.webp" alt="Tablet" />
                                <p>Tablet</p>
                            </a>
                            <a href="watch.html" className="category-card">
                                <img src="resimler/watch_new.webp" alt="Watch" />
                                <p>Watch</p>
                            </a>
                        </div>
                    </div>
                    <div className="search-bar-container">
                        <input type="text" className="search-input" placeholder="Search www.N308.com.tr" />
                        <button className="search-button">
                            <span className="icon">🔍</span>
                        </button>
                    </div>
                </div>
                <a href="cart.html" className="cart">🛒 Cart</a>
                <a href="login.html" className="login">👤 Log In</a>
            </div>

            {/* Carousel */}
            <div id="carouselIndicator" className="carousel slide" data-ride="carousel" data-interval="3000">
                <ol className="carousel-indicators">
                    <li data-target="#carouselIndicator" data-slide-to="0" className="active"></li>
                    <li data-target="#carouselIndicator" data-slide-to="1"></li>
                    <li data-target="#carouselIndicator" data-slide-to="2"></li>
                </ol>

                <div className="carousel-inner">
                    <div className="carousel-item active">
                        <img src="resimler/mainimage.jpg" className="d-block w-100" alt="Slide 1" />
                        <div className="carousel-caption">
                            <h5>Latest Arrivals</h5>
                            <p>Discover the newest products in our collection.</p>
                        </div>
                    </div>
                    <div className="carousel-item">
                        <img src="resimler/mainimage2.jpg" className="d-block w-100" alt="Slide 2" />
                        <div className="carousel-caption">
                            <h5>Exclusive Offers</h5>
                            <p>Grab the best deals on top brands.</p>
                        </div>
                    </div>
                    <div className="carousel-item">
                        <img src="resimler/mainimage3.png" className="d-block w-100" alt="Slide 3" />
                        <div className="carousel-caption">
                            <h5>Top Categories</h5>
                            <p>Explore a wide range of categories.</p>
                        </div>
                    </div>
                </div>

                <a className="carousel-control-prev" href="#carouselIndicator" role="button" data-slide="prev">
                    <span className="carousel-control-prev-icon"></span>
                </a>
                <a className="carousel-control-next" href="#carouselIndicator" role="button" data-slide="next">
                    <span className="carousel-control-next-icon"></span>
                </a>
            </div>

            {/* Popular Section */}
            <div id="popular-section" className="section">
                <h2>Popular Products</h2>
                <p style={{ fontSize: "1.5em" }}>Check out some of our most popular items. Get the best deals and hottest products in our store!</p>

                <div className="product-grid">
                    <div className="product-card">
                        <img src="resimler/1-big.jpeg" alt="Product 1" className="product-image" />
                        <h3 className="product-name">Apple Watch White</h3>
                        <p className="product-price">$299</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️☆</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>

                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/8.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>


                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/2.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>


                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/5.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>



                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/7.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>




                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/6.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>


                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/3.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>



                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/1-big.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>



                    {/* Additional product cards */}
                    <div className="product-card">
                        <img src="resimler/8.jpeg" alt="Product 2" className="product-image" />
                        <h3 className="product-name">Iphone 11 Pro</h3>
                        <p className="product-price">$999</p>
                        <div className="product-rating">
                            <span>⭐️⭐️⭐️⭐️⭐️</span>
                        </div>
                        <a href="cart.html" className="add-to-cart-button">Add to Cart</a>
                    </div>




                    {/* Repeat similar blocks for other products */}
                </div>
            </div>

            {/* About Section */}
            <div id="about-section" className="section about-section">
                <div className="about-content">
                    <h2>About Us</h2>
                    <h4>Welcome to N308, your premier e-commerce destination! We are committed to providing you with an unparalleled shopping experience by offering top-quality products, excellent customer service, and unbeatable prices.</h4>
                    <div className="about-highlights">
                        <div className="highlight">
                            <i className="ri-hand-heart-line icon"></i>
                            <h3>Customer First</h3>
                            <p>Your satisfaction is our top priority. We're here to support you at every step of your shopping journey.</p>
                        </div>
                        <div className="highlight">
                            <i className="ri-rocket-line icon"></i>
                            <h3>Fast Delivery</h3>
                            <p>Enjoy quick and reliable shipping options to get your items when you need them. We value your time!</p>
                        </div>
                        <div className="highlight">
                            <i className="ri-earth-line icon"></i>
                            <h3>Worldwide Reach</h3>
                            <p>Wherever you are, we’re there. Our global shipping options ensure everyone can shop with us.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-top">
                        <div>
                            <h6 className="footer-title">Customer Service</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Help & FAQs</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Shipping Information</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Returns & Exchanges</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Contact Us</a></li>
                            </ul>
                        </div>
                        <div>
                            <h6 className="footer-title">Contact</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><i className="ri-map-pin-line"></i> Istanbul, IST 34000, Turkey</li>
                                <li className="footer-list-item"><i className="ri-mail-line"></i> N308@ecommerce.com</li>
                                <li className="footer-list-item"><i className="ri-phone-line"></i> +90 234 567 88</li>
                                <li className="footer-list-item"><i className="ri-printer-line"></i> +90 234 567 89</li>
                            </ul>
                        </div>
                        <div>
                            <h6 className="footer-title">Resources</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Gift Cards</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Size Guide</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Product Reviews</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Sustainability</a></li>
                            </ul>
                        </div>
                        <div>
                            <h6 className="footer-title">Follow Us</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-facebook-circle-line"></i> Facebook</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-instagram-line"></i> Instagram</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-twitter-line"></i> Twitter</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-linkedin-line"></i> LinkedIn</a></li>
                            </ul>
                        </div>
                    </div>
                    <hr className="footer-divider" />
                    <div className="footer-bottom">
                        <span>&copy; N308 E-Commerce Platform. All rights reserved.</span>
                        <ul className="footer-list">
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-facebook-circle-line"></i></a></li>
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-instagram-line"></i></a></li>
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-twitter-line"></i></a></li>
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-linkedin-line"></i></a></li>
                        </ul>
                    </div>
                </div>
            </footer>

            {/* Back to Top Button */}
            <button id="backToTopBtn" onClick={scrollToTop}>
                <i className="ri-arrow-up-s-line"></i>
            </button>
        </div>
    );
};

export default MainPage;