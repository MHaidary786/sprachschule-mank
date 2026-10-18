const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard', adminController.dashboard);
router.get('/users', adminController.manageUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
