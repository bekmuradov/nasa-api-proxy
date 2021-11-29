const express = require('express');

const earthAssets = require('./earth-assets');

const marsWeather = require('./mars-weather');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

router.use('/earth-assets', earthAssets);
router.use('/mars-weather', marsWeather);

module.exports = router;
