import { useParams } from "react-router-dom";

function ProductPage() {
    const { productId } = useParams(); // Get productId from the URL

    // Example placeholder product data (you would likely fetch this data from your backend)
    const product = {
        id: productId,
        name: "Sample Product",
        description: "This is a sample product description.",
        price: 99.99,
        imageUrl: "path/to/image.jpg",
    };

    return (
        <div>
            <h1>{product.name}</h1>
            <img src={product.imageUrl} alt={product.name} />
            <p>{product.description}</p>
            <p>${product.price}</p>
        </div>
    );
}

export default ProductPage;