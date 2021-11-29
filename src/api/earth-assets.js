const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// 1. Number of request per IP address
// prevent from spamming API, by allowing 2 requests in 30 seconds from single IP address
const limiter = rateLimit({
  windowMs: 30 * 1000, // 15 minutes
  max: 10 // limit each IP to 100 requests per windowMs
});

const speedLimiter = slowDown({
  windowMs: 30 * 1000,
  delayAfter: 1,
  delayMs: 500
});

const router = express.Router();

const BASE_URL = 'https://api.nasa.gov/planetary/earth/assets?';

let cachedData;
let cachedTime;

const apiKeys = new Map();
apiKeys.set('12345', true);

router.get('/', limiter, speedLimiter, (req, res, next) => {
  const apiKey = req.get('X-API-KEY');
  if (apiKeys.has(apiKey)) {
    next();
  } else {
    const error = new Error('Invalid API key');
    next(error);
  }
}, async (req, res, next) => {
  if (cachedTime && cachedTime > Date.now() - (30 * 1000)) {
    return res.json(cachedData);
  }
  try {
    const params = new URLSearchParams({
      api_key: process.env.NASA_API_KEY,
      lon: '-95.33',
      lat: '29.78',
      date: '2021-01-01',
      dim: '0.15'
    });
    // make request to NASA NASA_API_KEY
    const { data } = await axios.get(`${BASE_URL}${params}`);
    cachedData = data;
    cachedTime = Date.now();
    data.cachedTime = cachedTime;
    // respond to this req with data from API
    return res.json(data);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
