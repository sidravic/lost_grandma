const {Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn} = require('./../../models')
const Sequelize = require('sequelize');

const op = Sequelize.Op;
Image.update({source: 'other'},
    {
        where: {
            image_url: {
                [op.notILike]: 'https://www.sephora.com/productImages/%'
            }
        }
    }).then((r) => {
        debugger;
    console.log(r);
})