const express = require('express');
const auth = require('../controllers/auth');
const products = require('../controllers/products');
const dashboard = require('../controllers/dashboard');
const settings = require('../controllers/settings');
const requireAuth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();
router.post('/auth/signup', asyncHandler(auth.signup));
router.post('/auth/login', asyncHandler(auth.login));
router.post('/auth/logout', auth.logout);
router.use(requireAuth);
router.get('/auth/me', asyncHandler(auth.me));
router.get('/products', asyncHandler(products.list));
router.post('/products', asyncHandler(products.create));
router.get('/products/:id', asyncHandler(products.get));
router.put('/products/:id', asyncHandler(products.update));
router.delete('/products/:id', asyncHandler(products.remove));
router.get('/dashboard/overview', asyncHandler(dashboard.overview));
router.get('/settings', asyncHandler(settings.get));
router.put('/settings', asyncHandler(settings.update));

module.exports = router;
