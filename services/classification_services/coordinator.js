const logger = require('./../../config/logger.js');
const {BaseService, BaseServiceResponse} = require('./../base_service');
const {createTag, batchUploadImages, deleteTag, deleteImages} = require('./azure_classifier_training');
const getSignedGETUrlFromS3Url = require('./../image_services/s3_operations').getSignedGETUrlFromS3Url;
const Constants = require('./../constants')
const addUploadStatusesToRedis = require('./classified_products_for_project').addUploadStatusesToRedis;

const filterImagesByLabels = async (service) => {

    const images = service.Images;
    const selectedImages = images.filter((image) => {

        const labelValues = image.ImageLabels.map((imageLabel) => {
            return imageLabel.label;
        })
        const restrictedLabelValues = [] //Constants.RestrictedLabels;
        let containsSomeRestrictedLabels = labelValues.some((labelValue) => {
            restrictedLabelValues.includes(labelValue)
        });

        return (containsSomeRestrictedLabels) ? false : true;
    })

    service.validImages = selectedImages;
    return service.validImages;
}

const filterByS3ImageUrl =  async (service) => {
    const validImages = service.validImages;

    const imagesWithS3Url = validImages.filter((image) => {
        return (image.s3_image_url == null) ? false : true;
    })

    service.validImages = imagesWithS3Url;
    return service.validImages;

}

const check5ValidImages = (service) => {

    if (!(service.validImages.length >= 5)) {
        service.addErrors(['Less than 5 images to classifiy']);
        service.errorCode = 'error_less_than_5_images_to_classify';
        return;
    }
    return;
}

const uploadImageToClassifier = async (service) => {

    if (service.anyErrors()) {
        return;
    }

    const imageTagName = service.product.id;
    const tagCreateResponse = await createTag(service.classifierProject, imageTagName)
    const imageTagId = tagCreateResponse.id;

    const batch = {
        images: [],
        tagIds: []
    }

    const imagesWithTags = Promise.all(service.validImages.map(async (image) => {
        const s3SignedGetUrl = await getSignedGETUrlFromS3Url(image.s3_image_url)
        return Promise.resolve({
            url: s3SignedGetUrl,
            tagIds: [imageTagId]
        })
    }))

    batch.images = await imagesWithTags;
    batch.tagIds.push(imageTagId);

    const uploadResponse = await batchUploadImages(service.classifierProject, batch);
    if (!uploadResponse.isBatchSuccessful) {
        const errors = uploadResponse.images.map((image) => {
            return image.status;
        })
        service.addErrors(errors);
        service.errorCode = 'error_uploading_image_to_azure';
        logger.error({
            src: 'coordinator.js',
            event: 'uploadImageToClassifier',
            error: {message: errors, uploadResponse: uploadResponse, projectId: service.classifierProject.id}
        })
    };
    service.uploadResponse = uploadResponse;
    service.imageTagId = imageTagId;
    return uploadResponse;
}

const deleteImagesAndTagIfLessThan5Images = async(service) => {

    const uploadResponse = service.uploadResponse;
    const images = uploadResponse.images;
    const OkImages = [];
    const ErrorImages = [];

    images.map(async(image) => {
        if (image.status == 'OK') {
            OkImages.push(image)
        } else {
            ErrorImages.push(image)
        }
    });

    if (OkImages.length < 5){
        const deleteTagResponse = await deleteTag(service.classifierProject, service.imageTagId);
        logger.info({src: 'classification_services/coordinator', event: 'deleteImagesAndTagIfLessThan5Images', data: { deleteTagResponse: deleteTagResponse }})
        const imageIds = images.map((image) => {return image.image.id})
        const deleteImagesResponse = await deleteImages(service.classifierProject, imageIds);
        logger.info({src: 'classification_services/coordinator', event: 'deleteImagesAndTagIfLessThan5Images', data: { deleteImagesResponse: deleteImagesResponse }})
    } else{
        await addUploadStatusesToRedis(service.classifierProject, service.product.id, uploadResponse);
    }

    return;
}

class Coordinator extends BaseService {
    constructor() {
        super();
        this.product = null;
        this.image = [];
        this.brand = null;
        this.validImages = []
        this.classifierProject = null;
    }

    async invoke(product, classifierProject) {
        this.product = product;
        this.brand = product.Brand;
        this.Images = product.Images;
        this.classifierProject = classifierProject;

        await filterImagesByLabels(this);
        await filterByS3ImageUrl(this);
        await check5ValidImages(this);
        await uploadImageToClassifier(this);
        await deleteImagesAndTagIfLessThan5Images(this);

        return (new Promise((resolve, reject) => {
            if (this.anyErrors()) {
                //this.processFailures();
                reject(this)
            } else {
                resolve(this);
            }
        }));
    }
}

module.exports = Coordinator;