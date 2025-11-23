const express = require('express');
const dns = require('dns');
const app = express();
const port = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));


const urlMap = new Map();
let counter = 1;


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});


app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  
  
  let urlObj;
  try {
    urlObj = new URL(originalUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
  
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }
  
  
  dns.lookup(urlObj.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    
    
    for (let [short, original] of urlMap) {
      if (original === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: parseInt(short)
        });
      }
    }
    
    
    const shortUrl = counter;
    urlMap.set(shortUrl.toString(), originalUrl);
    counter++;
    
    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});


app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlMap.get(shortUrl);
  
  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
