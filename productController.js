const express = require('express');
const Product = require('./models/product');
const router = express.Router();

// add one prodcut to database route
router.post('/add-product', async(req, res) => {

    const {name, model, serialNumber} = req.body;

    try 
    {
    // check if product already exist by searching for matching model or serial number
        const existingProduct = await Product.findOne({
            $or: [{model:model}, {serialNumber: serialNumber}] 
        });

        if(existingProduct) {
            // if existing product found check if the names match
            if(existingProduct.name != name){
                return res.status(400).json({
                    message: 'A product with this model or serial number already exist with a different name.'
                });
            }

            return res.status(400).json({
                message: 'Product already exists.'
            });
        }

        // create new product
        const newProduct = new Product(req.body);
        await newProduct.save();

        res.status(201).json({
            message: 'Product added to database succesfully'
        });
    } catch(error){
        console.error('Error adding product:', error);
        res.status(500).json({
            message: 'server error'
        });
    }
}
);

// add multiple products to database
router.post('/add-multiple_products', async(req,res) =>{
    const products = req.body;
    const uniqueProducts = []; // this will hold uniqe products within the list
    let existingProductCount = 0; 

    // filter duplicates within the products list
    for(const product in products){
        const {model, serialNumber} = product;
        // check if the product with the same model or serailNumber exist in the uniqeProducts
        if (!uniqueProducts.some(p => p.model === model || p.serailNumber === serialNumber)){
            uniqueProducts.push(product);
        }
    }

    // process each product in uniqueProduct to check if they exist in the db
    try{
       for (const product in uniqueProduct){
            const existingProduct = await Product.findOne({
                $or: [{model: model}, {serialNumber: serialNumber}]
            });

            if (existingProduct){
                console.log(`Product already exist in the database with model: ${product.model} or serial number: ${product.serialNumber} `);

                existingProductCount ++;

                continue; //skip this product since its already in the database
            }

            await Product.create(product); // insert the new product to db
       } 

       res.status(201).json({
            message: `${uniqueProducts.length - duplicateCount} products added successfully.`, duplicateCount
       });
    } catch (error){
        console.error('Error adding multiple products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;