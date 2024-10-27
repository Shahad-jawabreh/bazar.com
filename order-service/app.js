const express = require('express');
const fs = require('fs');
const axios = require('axios');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { v4: uuidv4 } = require('uuid'); // Import the uuid library
const cors = require('cors'); // Import cors

const app = express();
app.use(cors());

const PORT = 3001;
let orders = [];
// CSV file paths
// CSV file paths

const orderCsvFilePath = 'orderData.csv'; // Local file for order service

// Function to read a CSV file into an array of objects
async function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Function to update the stock of a book in the catalog
async function updateCatalogStock(bookId, newStock) {
    try {
        const catalog = await readCsv(catalogFilePath);
        const bookIndex = catalog.findIndex(book => parseInt(book.ID) === bookId);

        if (bookIndex !== -1) {
            catalog[bookIndex].Stock = newStock; // Ensure correct casing

            const csvWriter = createObjectCsvWriter({
                path: catalogFilePath,
                header: [
                    { id: 'ID', title: 'ID' }, // Ensure casing matches the CSV
                    { id: 'Title', title: 'Title' },
                    { id: 'Topic', title: 'Topic' },
                    { id: 'Price', title: 'Price' },
                    { id: 'Stock', title: 'Stock' },
                ],
            });

            await csvWriter.writeRecords(catalog);
            console.log(`Stock for Book ID ${bookId} updated successfully.`);
        } else {
            console.log(`Book ID ${bookId} not found in catalog.`);
        }
    } catch (error) {
        console.error('Error updating catalog stock:', error);
    }
}

// Function to create a new order
async function createOrder(orderId, bookId) {
    orders = await readCsv(orderCsvFilePath);
    const newOrder = { orderId, bookId };

    const csvWriter = createObjectCsvWriter({
        path: orderCsvFilePath,
        header: [
            { id: 'orderId', title: 'orderId' },
            { id: 'bookId', title: 'bookId' },
        ],
    });

    await csvWriter.writeRecords([...orders, newOrder]);
}
app.get('/', function(req, res){
  return res.json("hellooo world");
})
// Endpoint to purchase a book
app.post('/purchase/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const books = await axios.get(`http://catalog-service:3000/info/${id}`);
    const book = books.data
    try {
        if (book && parseInt(book.Stock) > 0) { // Ensure to parse stock to an integer
           
            // Create a new order
            const newOrderId = uuidv4(); // Generate a unique order ID using uuid
            const response = await axios.post(`http://catalog-service:3000/stock/${id}`);
            if(response.status == 200)
           { await createOrder(newOrderId, id); // Create the order
          
            res.send(`Book ${book.Title} purchased successfully. Order ID: ${newOrderId}`);}
            else  res.send('Out of stock');
        } else {
            res.send('Out of stock');
        }
    } catch (error) {
        console.error('Error purchasing the book:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Order service running on port ${PORT}`);
});
