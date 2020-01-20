const express = require('express');
const router = express.Router();

const WelcomeController = require('./../controllers/v1/welcome_controller');
const PredictionsController = require('./../controllers/v1/predictions_controller')

//Welcome

router.get('/', WelcomeController.Index);

// Predictions

router.get('/api/v1/:provider/predict', PredictionsController.Get);
router.post('/api/v1/:provider/predict', PredictionsController.Create)
module.exports = router;