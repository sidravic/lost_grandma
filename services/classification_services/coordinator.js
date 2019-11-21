const { Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn } = require('./../../models')

const findProductsWithImages = async () => {
    Image.findAll()
}

