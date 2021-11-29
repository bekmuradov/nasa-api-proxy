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

// 2. Increase the response time
const speedLimiter = slowDown({
  windowMs: 30 * 1000, // 30 seconds
  delayAfter: 1, // allow 1 request per 30 seconds, then...
  delayMs: 500 // begin adding 500ms of delay per request above 1:
  // request # 2 is delayed by  500ms
  // request # 3 is delayed by 1000ms
  // request # 4 is delayed by 1500ms
  // etc.
});

const router = express.Router();

const BASE_URL = 'https://api.nasa.gov/insight_weather/?';

// to reduce the number of API requests
// here I am using local memory
// in production use Redis or Database
let cachedData;
let cachedTime;

// those API keys should be stored in Database
const apiKeys = new Map();
apiKeys.set('12345', true);

// we are rate limiting by IP address
// it would be better to rate limit by account
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
      feedtype: 'json',
      ver: '1.0'
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
