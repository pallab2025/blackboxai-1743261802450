const Meal = require('../models/Meal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get all meals
exports.getAllMeals = catchAsync(async (req, res, next) => {
  const meals = await Meal.find({ available: true })
    .sort('category name');

  res.status(200).json({
    status: 'success',
    results: meals.length,
    data: {
      meals
    }
  });
});

// Get single meal
exports.getMeal = catchAsync(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);

  if (!meal) {
    return next(new AppError('No meal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      meal
    }
  });
});

// Create new meal (Admin only)
exports.createMeal = catchAsync(async (req, res, next) => {
  const meal = await Meal.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      meal
    }
  });
});

// Update meal (Admin only)
exports.updateMeal = catchAsync(async (req, res, next) => {
  const meal = await Meal.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!meal) {
    return next(new AppError('No meal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      meal
    }
  });
});

// Delete meal (Admin only)
exports.deleteMeal = catchAsync(async (req, res, next) => {
  const meal = await Meal.findByIdAndDelete(req.params.id);

  if (!meal) {
    return next(new AppError('No meal found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Reset daily meal counts (Admin only)
// Get popular meals for admin dashboard
exports.getPopularMeals = catchAsync(async (req, res, next) => {
  const meals = await Meal.aggregate([
    {
      $project: {
        name: 1,
        totalOrders: { $size: '$reviews' },
        soldToday: 1,
        dailyLimit: 1
      }
    },
    { $sort: { totalOrders: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    status: 'success',
    data: meals
  });
});

exports.resetDailyCounts = catchAsync(async (req, res, next) => {
  await Meal.updateMany(
    {},
    { $set: { soldToday: 0 } }
  );

  res.status(200).json({
    status: 'success',
    message: 'Daily meal counts reset'
  });
});