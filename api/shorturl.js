const dns = require('dns');
const { URL } = require('url');


let urlDatabase = [];
let urlCounter = 1;

module.exports = async (req, res) => {
 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  
  if (req.method === 'POST') {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      
      const { url } = JSON.parse(body);
      
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

      
      const existingUrl = urlDatabase.find(entry => entry.original_url === url);
      if (existingUrl) {
        return res.json({
          original_url: existingUrl.original_url,
          short_url: existingUrl.short_url
        });
      }

      
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
      
      return res.json(response);

    } catch (error) {
      return res.json({ error: 'invalid url' });
    }
  }

  
  else if (req.method === 'GET') {
    const path = req.url;
    
   
    if (path.startsWith('/api/shorturl/')) {
      const shortUrlPath = path.replace('/api/shorturl/', '');
      const shortUrl = parseInt(shortUrlPath);

      if (isNaN(shortUrl)) {
        return res.status(400).json({ error: 'Wrong format' });
      }

      const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);
      
      if (!urlEntry) {
        return res.status(404).json({ error: 'No short URL found for the given input' });
      }

      
      res.writeHead(302, {
        'Location': urlEntry.original_url
      });
      return res.end();
    }
    
    
    return res.json({ 
      message: 'URL Shortener Microservice',
      usage: 'POST a URL to /api/shorturl to get a shortened URL'
    });
  }

 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
