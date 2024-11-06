const express = require('express');
const fs = require('fs');
const axios = require('axios');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { v4: uuidv4 } = require('uuid'); // Import the uuid library
const cors = require('cors'); // Import cors

const app = express();
app.use(cors());

const PORT = 3003;
let orders = [];
// CSV file paths
// CSV file paths

const orderCsvFilePath = 'orderData.csv'; // Local file for order service
const catalogReplicas = ['http://catalog-service:3000', 'http://catalog-service-rep:3002']; // Catalog replicas

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
  return res.json("hello world");
})
// Endpoint to purchase a book
// Sync stock across catalog replicas
async function syncStockAcrossReplicas(bookId, newStock) {
    for (const url of catalogReplicas) {
        try {
            await axios.post(`${url}/sync-stock/${bookId}`, { Stock: newStock });
            console.log(`Synced stock to ${url} for Book ID ${bookId}`);
        } catch (error) {
            console.error(`Error syncing stock to ${url}:`, error);
        }
    }
}

// Purchase endpoint
app.post('/purchase/:id', async (req, res) => {
    const bookId = parseInt(req.params.id);

    try {
        const catalogUrl = catalogReplicas[Math.floor(Math.random() * catalogReplicas.length)];
        const bookResponse = await axios.get(`${catalogUrl}/info/${bookId}`);
        const book = bookResponse.data;

        if (book && parseInt(book.Stock) > 0) {
            const newOrderId = uuidv4();
            const stockResponse = await axios.post(`${catalogUrl}/stock/${bookId}`);

            if (stockResponse.status === 200) {
                await syncStockAcrossReplicas(bookId, parseInt(book.Stock) - 1);
                res.send(`Book ${book.Title} purchased successfully. Order ID: ${newOrderId}`);
            } else {
                res.send('Out of stock');
            }
        } else {
            res.send('Out of stock');
        }
    } catch (error) {
        console.error('Error purchasing the book:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/unpurchase/:id', async (req, res) => {
    const bookId = parseInt(req.params.id);

    try {
        const catalogUrl = catalogReplicas[Math.floor(Math.random() * catalogReplicas.length)];
        const bookResponse = await axios.get(`${catalogUrl}/info/${bookId}`);
        const book = bookResponse.data;

        if (book && parseInt(book.Stock) > 0) {
            const newOrderId = uuidv4();
            const stockResponse = await axios.post(`${catalogUrl}/unstock/${bookId}`);

            if (stockResponse.status === 200) {
                await syncStockAcrossReplicas(bookId, parseInt(book.Stock) + 1);
                res.send(`Book ${book.Title} purchased successfully. Order ID: ${newOrderId}`);
            } else {
                res.send('Out of stock');
            }
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
