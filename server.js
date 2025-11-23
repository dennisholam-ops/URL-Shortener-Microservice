const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage for URLs
let urlDatabase = [];
let urlCounter = 1;

// Helper function to validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    // Check if protocol is http or https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    // Check if hostname is not empty
    if (!url.hostname) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Helper function to check if URL exists using DNS lookup
function urlExists(hostname, callback) {
  dns.lookup(hostname, (err) => {
    if (err) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// POST endpoint to shorten URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  
  console.log('Received URL:', originalUrl);
  
  // Check if URL is provided
  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }
  
  // Validate URL format
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }
  
  try {
    const urlObj = new URL(originalUrl);
    const hostname = urlObj.hostname;
    
    // Check if URL exists via DNS lookup
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
      const shortUrl = urlCounter;
      const newUrl = {
        original_url: originalUrl,
        short_url: shortUrl
      };
      
      urlDatabase.push(newUrl);
      urlCounter++;
      
      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    });
  } catch (err) {
    console.error('Error processing URL:', err);
    res.json({ error: 'invalid url' });
  }
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  
  console.log('Redirect request for short URL:', shortUrl);
  console.log('Database:', urlDatabase);
  
  if (isNaN(shortUrl) || shortUrl < 1) {
    return res.json({ error: 'invalid short url' });
  }
  
  const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);
  
  if (!urlEntry) {
    return res.json({ error: 'short url not found' });
  }
  
  console.log('Redirecting to:', urlEntry.original_url);
  res.redirect(urlEntry.original_url);
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
