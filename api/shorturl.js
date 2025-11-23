const { URL } = require('url');


let urlDatabase = [];
let urlCounter = 1;

module.exports = async (req, res) => {
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  
  if (req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const { url } = JSON.parse(body);
      
      if (!url) {
        return res.status(400).json({ error: 'invalid url' });
      }

      
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return res.json({ error: 'invalid url' });
      }

      
      const validProtocols = ['http:', 'https:'];
      if (!validProtocols.includes(parsedUrl.protocol)) {
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
      urlCounter++;

      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url
      });

    } catch (error) {
      res.status(400).json({ error: 'invalid url' });
    }
  }

  // GET 請求 - 重定向短網址
  else if (req.method === 'GET') {
    const path = req.url;
    
    // 如果係 /api/shorturl，顯示使用說明
    if (path === '/api/shorturl') {
      return res.json({
        message: 'URL Shortener Microservice',
        usage: 'POST a URL to /api/shorturl to get a shortened URL'
      });
    }

    // 處理短網址重定向
    if (path.startsWith('/api/shorturl/')) {
      const shortUrlPath = path.replace('/api/shorturl/', '');
      const shortUrl = parseInt(shortUrlPath);

      if (isNaN(shortUrl)) {
        return res.status(400).json({ error: 'invalid short url' });
      }

      const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);
      
      if (!urlEntry) {
        return res.status(404).json({ error: 'short url not found' });
      }

      
      res.writeHead(302, {
        'Location': urlEntry.original_url
      });
      return res.end();
    }
  }

  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};


function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}
