const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage for URLs (in production, use a database)
let urlDatabase = [];
let urlCounter = 1;

// Helper function to validate URL
function isValidUrl(string) {
  try {
    const parsedUrl = new URL(string);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// Helper function to check if URL exists using DNS lookup
function urlExists(hostname, callback) {
  dns.lookup(hostname, (err) => {
    callback(!err);
  });
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST endpoint to shorten URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  
  // Validate URL format
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }
  
  // Extract hostname for DNS lookup
  const hostname = new URL(originalUrl).hostname;
  
  // Check if URL exists
  urlExists(hostname, (exists) => {
    if (!exists) {
      return res.json({ error: 'invalid url' });
    }
    
    // Check if URL already exists in database
    const existingUrl = urlDatabase.find(entry => entry.original_url === originalUrl);
    
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }
    
    // Create new short URL
    const shortUrl = urlCounter++;
    const newUrl = {
      original_url: originalUrl,
      short_url: shortUrl
    };
    
    urlDatabase.push(newUrl);
    
    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  
  if (isNaN(shortUrl)) {
    return res.json({ error: 'invalid short url' });
  }
  
  const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);
  
  if (!urlEntry) {
    return res.json({ error: 'short url not found' });
  }
  
  res.redirect(urlEntry.original_url);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
