const express = require('express');
const app = express();
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors'); // Import cors
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
app.use(cors());
const PORT = 3000;

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
app.post('/stock/:id', async(req, res) => {
    const catalog = await readCsv('catalogData.csv'); // Load catalog data each time
    const id = parseInt(req.params.id, 10);
    const bookIndex = catalog.findIndex(b => parseInt(b.ID) === id);

    if (bookIndex === -1) {
        return res.status(404).send('Book not found');
    }
    if (catalog[bookIndex].Stock > 0) {
        catalog[bookIndex].Stock -= 1;
        writeCsv('catalogData.csv', catalog); // Write updated catalog back to file
        res.status(200).send('Stock updated successfully');
    } else {
        res.status(400).send('Out of stock');
    }
});
app.listen(PORT, () => {
    console.log(`Catalog service running on port ${PORT}`);
});
