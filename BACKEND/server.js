const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const shortUrls = new Map();

app.use(bodyParser.json());
app.post('/shorturls', (req, res) => {
    const { url, validity = 30, shortcode } = req.body;

    try {
        new URL(url);
    } catch (err) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    const finalCode = shortcode || crypto.randomBytes(3).toString('hex');

    if (shortUrls.has(finalCode)) {
        return res.status(409).json({ error: 'Shortcode already in use' });
    }

    const expiry = new Date(Date.now() + validity * 60000).toISOString();

    shortUrls.set(finalCode, {
        originalUrl: url,
        expiry
    });
    return res.status(201).json({
        shortLink: `http://localhost:${PORT}/${finalCode}`,
        expiry
    });
});

app.get('/:shortcode', (req, res) => {
    const { shortcode } = req.params;
    const record = shortUrls.get(shortcode);

    if (!record) {
        return res.status(404).send('URL not found');
    }

    const currentTime = new Date();
    const expiryTime = new Date(record.expiry);

    if (currentTime > expiryTime) {
        shortUrls.delete(shortcode);
        return res.status(410).send('URL has expired');
    }

    res.redirect(record.originalUrl);
});

app.get('/shorturls/:shortcode', (req, res) => {
    const { shortcode } = req.params;
    const record = shortUrls.get(shortcode);

    if (!record) {
        return res.status(404).json({ error: 'Shortcode not found' });
    }

    const currentTime = new Date();
    const expiryTime = new Date(record.expiry);
    const isExpired = currentTime > expiryTime;

    res.status(200).json({
        originalUrl: record.originalUrl,
        expiry: record.expiry,
        expired: isExpired
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

