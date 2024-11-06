const express = require('express');
const app = express();
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors'); // Import cors
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
app.use(cors());
const PORT = 3002;
app.use(express.json());
// Function to read CSV file and return parsed results
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
// Function to write updated catalog back to CSV file
async function writeCsv(filePath, data) {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: [
            { id: 'ID', title: 'ID' },
            { id: 'Title', title: 'Title' },
            { id: 'Author', title: 'Author' },
            { id: 'Topic', title: 'Topic' },
            { id: 'Stock', title: 'Stock' }
        ]
    });
    await csvWriter.writeRecords(data); // Write the records to CSV
}
// Search by topic
app.get('/search/:topic', async (req, res) => {
    try {
        const catalog = await readCsv('catalogData.csv'); // Await the reading of the CSV
        const topic = req.params.topic.toLowerCase();
        const filteredResults = catalog.filter(book => book.Topic.toLowerCase() === topic);
        res.json(filteredResults);
    } catch (error) {
        res.status(500).send('Error reading catalog data');
    }
});
app.get('/', (req, res) => {
    return res.json("hiiiii")
})
// Get book info by ID
app.get('/info/:id', async (req, res) => {
    try {
        const catalog = await readCsv('catalogData.csv'); // Await the reading of the CSV
        const id = parseInt(req.params.id);
        const book = catalog.find(b => parseInt(b.ID) === id);
        if (book) {
            res.json(book);
        } else {
            res.status(404).send('Book not found');
        }
    } catch (error) {
        res.status(500).send('Error reading catalog data');
    }
});

app.post('/sync-stock/:id', async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const newStock = req.body.Stock;

    try {
        const catalog = await readCsv('catalogData.csv');
        const bookIndex = catalog.findIndex(b => parseInt(b.ID) === bookId);

        if (bookIndex === -1) {
            return res.status(404).send('Book not found');
        }
        catalog[bookIndex].Stock = newStock;
        await writeCsv('catalogData.csv', catalog);

        console.log(`Stock for Book ID ${bookId} synced to ${newStock}`);
        res.status(200).send('Stock synced successfully');
    } catch (error) {
        console.error('Error syncing stock:', error);
        res.status(500).send('Error syncing stock');
    }
});

// Update stock endpoint that calls syncStockAcrossReplicas
app.post('/stock/:id', async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const catalog = await readCsv('catalogData.csv');
    const bookIndex = catalog.findIndex(b => parseInt(b.ID) === bookId);

    if (bookIndex === -1) return res.status(404).send('Book not found');

    if (catalog[bookIndex].Stock > 0) {
        catalog[bookIndex].Stock -= 1;
        await writeCsv('catalogData.csv', catalog);
        res.status(200).send('Stock updated successfully');
    } else {
        res.status(400).send('Out of stock');
    }
});


app.post('/unstock/:id', async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const catalog = await readCsv('catalogData.csv');
    const bookIndex = catalog.findIndex(b => parseInt(b.ID) === bookId);

    if (bookIndex === -1) return res.status(404).send('Book not found');

    if (catalog[bookIndex].Stock > 0) {
        catalog[bookIndex].Stock += 1;
        await writeCsv('catalogData.csv', catalog);
        res.status(200).send('unStock updated successfully');
    } else {
        res.status(400).send('Out of stock');
    }
});
app.listen(PORT, () => {
    console.log(`Catalog service running on port ${PORT}`);
});
