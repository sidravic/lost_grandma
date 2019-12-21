const express = require('express');
const router = express.Router();

const WelcomeController = require('./../controllers/v1/welcome_controller');
const PredictionsController = require('./../controllers/v1/predictions_controller')

//Welcome

router.get('/', WelcomeController.Index);

// Predictions

router.post('/api/v1/predict', PredictionsController.Create)
module.exports = router;