const express = require('express');
const mealController = require('../controllers/mealController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/', mealController.getAllMeals);
router.get('/:id', mealController.getMeal);

// Protected admin routes
router.use(authController.protect, authController.restrictTo('admin'));

router.post('/', mealController.createMeal);
router.patch('/:id', mealController.updateMeal);
router.delete('/:id', mealController.deleteMeal);
router.post('/reset-counts', mealController.resetDailyCounts);

module.exports = router;