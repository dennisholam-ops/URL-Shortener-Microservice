const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


const urlDatabase = [];
let urlCounter = 1;


app.post('/api/shorturl', function (req, res) {
  const { url } = req.body;
  
  if (!url) {
    return res.json({ error: 'invalid url' });
  }

  let urlObject;
  try {
    urlObject = new URL(url);
    
   
    if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }


  dns.lookup(urlObject.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

   
    const existingUrl = urlDatabase.find(item => item.original_url === url);
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
    
  
    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    });
    
    urlCounter++;
  });
});


app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = parseInt(req.params.short_url);
  
  if (isNaN(shortUrl)) {
    return res.json({ error: 'Wrong format' });
  }

  const urlEntry = urlDatabase.find(item => item.short_url === shortUrl);
  
  if (!urlEntry) {
    return res.json({ error: 'No short URL found for the given input' });
  }


  res.redirect(urlEntry.original_url);
});


const listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
