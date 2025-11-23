const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


let urlDatabase = [];
let urlCounter = 1;


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});


app.post('/api/shorturl', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.json({ error: 'invalid url' });
    }

   
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.json({ error: 'invalid url' });
      }
    } catch (err) {
      return res.json({ error: 'invalid url' });
    }

    // 使用 dns.lookup 驗證主機名是否存在
    try {
      await new Promise((resolve, reject) => {
        dns.lookup(parsedUrl.hostname, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (dnsError) {
      return res.json({ error: 'invalid url' });
    }

    // 檢查是否已有該 URL
    const existingUrl = urlDatabase.find(entry => entry.original_url === url);
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    // 創建新短網址
    const newUrl = {
      original_url: url,
      short_url: urlCounter
    };

    urlDatabase.push(newUrl);
    
    const response = {
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    };
    
    urlCounter++;
    
    res.json(response);

  } catch (error) {
    res.json({ error: 'invalid url' });
  }
});


app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  if (isNaN(shortUrl)) {
    return res.status(400).json({ error: 'Wrong format' });
  }

  const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);
  
  if (!urlEntry) {
    return res.status(404).json({ error: 'No short URL found for the given input' });
  }

  
  res.redirect(urlEntry.original_url);
});


app.get('/api/shorturl', (req, res) => {
  res.json({ 
    message: 'URL Shortener Microservice',
    usage: 'POST a URL to /api/shorturl to get a shortened URL'
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
