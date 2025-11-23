const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Routes
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// URL Shortener Logic
let urlDatabase = [];
let shortUrlCounter = 1;

app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // Validate URL format
  let urlObject;
  try {
    urlObject = new URL(originalUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
  
  // Check protocol
  const allowedProtocols = ['http:', 'https:'];
  if (!allowedProtocols.includes(urlObject.protocol)) {
    return res.json({ error: 'invalid url' });
  }
  
  // DNS lookup to verify host exists
  dns.lookup(urlObject.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    
    // Check if URL already exists
    const existingEntry = urlDatabase.find(entry => entry.original_url === originalUrl);
    if (existingEntry) {
      return res.json({
        original_url: existingEntry.original_url,
        short_url: existingEntry.short_url
      });
    }
    
    // Create new short URL
    const newEntry = {
      original_url: originalUrl,
      short_url: shortUrlCounter
    };
    
    urlDatabase.push(newEntry);
    
    res.json({
      original_url: newEntry.original_url,
      short_url: newEntry.short_url
    });
    
    shortUrlCounter++;
  });
});

// Redirect short URL to original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  
  const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);
  
  if (urlEntry) {
    res.redirect(urlEntry.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

// Start server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
