const {truncate} = require('./../../helpers/test_helper');

const expect = require('chai').expect;
const sinon = require('sinon')
const azurePredict = require('./../../../services/prediction_services/azure_classifier_prediction')

const fs = require('fs');
const path = require('path')
const {createProductSuite} = require('./../../helpers/model_helper');
const Coordinator = require('./../../../services/prediction_services/coordinator');

describe('PredictionService#Coordinator', () => {
    beforeEach(async () => {
        await truncate();
        return;
    })

    afterEach(async () => {
        await truncate();
        return;
    })

    context('when the prediction score is right', () => {
        it('should not return an error', async () => {
            const [brand, product, source, image] = await createProductSuite();
            const jsonFilePath = path.join(__dirname, './../../fixtures/prediction_services/success.json');
            const successResponse = JSON.parse(fs.readFileSync(jsonFilePath, {encoding: 'utf-8'}));
            const stub = sinon.stub(azurePredict, 'predictUrl')
            stub.resolves(successResponse);

            const coordinator = new Coordinator();
            const response = await coordinator.invoke('https://www.therightimage.jpg');

            expect(response.errors.length).to.equal(0)
            expect(response.errorCode).to.equal(null);
            expect(response.topPredictionTag).to.equal(product.id);
            expect(response.predictionConfidence).to.equal(0.917695456)
            stub.restore();
            return;
        })
    })

    context('when the predicition score is below 80%', () => {
        it('should return an error with errorCode `error_low_prediction_confidence', async () => {
            const jsonFilePath = path.join(__dirname, './../../fixtures/prediction_services/poor_prediction.json');
            const poorPredictionResponse = JSON.parse(fs.readFileSync(jsonFilePath, {encoding: 'utf-8'}));
            const stub = sinon.stub(azurePredict, 'predictUrl');
            stub.resolves(poorPredictionResponse);

            const coordinatorService = new Coordinator();
            try {
                await coordinatorService.invoke('https://someimagewithpoorscore.jpg');
            } catch (errorResponse) {
                expect(errorResponse.errors.length).to.equal(1);
                expect(errorResponse.errorCode).to.equal('error_low_prediction_confidence');
                expect(errorResponse.isSuccess()).to.be.false;
                stub.restore();
                return;
            }
            return;
        })
    })

    context('when the predicted productTag does exist', () => {
        it('should return the product', async () => {
            const [brand, product, source, image] = await createProductSuite();
            const jsonFilePath = path.join(__dirname, './../../fixtures/prediction_services/success.json');
            const successResponse = JSON.parse(fs.readFileSync(jsonFilePath, {encoding: 'utf-8'}));
            const stub = sinon.stub(azurePredict, 'predictUrl')
            stub.resolves(successResponse);

            const coordinator = new Coordinator();
            const response = await coordinator.invoke('https://www.therightimage.jpg');
            expect(response.product.id).to.equal(product.id);
            expect(response.errors.length).to.equal(0)
            stub.restore();
            return
        })
    })

    context('when the predicted productTag does not exist', () => {
        it('should throw an error with errorCode `error_product_not_found`', async () => {
            const jsonFilePath = path.join(__dirname, './../../fixtures/prediction_services/success.json');
            const successResponse = JSON.parse(fs.readFileSync(jsonFilePath, {encoding: 'utf-8'}));
            const stub = sinon.stub(azurePredict, 'predictUrl')
            stub.resolves(successResponse);

            const coordinator = new Coordinator();
            try {
                const response = await coordinator.invoke('https://www.therightimage.jpg');
            } catch (errorResponse) {
                expect(errorResponse.isSuccess()).to.be.false
                expect(errorResponse.errorCode).to.equal('error_product_not_found');
                stub.restore();
                return;
            }
        })
    })
});
