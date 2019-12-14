const {Brand, Product, Image, Source, dbConn} = require('./../../models');

const createBrand = async (brandOptions) => {
    const defaultBrandOptions = {
        name: 'Brand A',
        brand_name_slug: 'brand-a',
        id: '95e12c34-129f-4c91-b03a-2b4c644dbb32'
    }
    brandOptions = {...defaultBrandOptions, ...brandOptions};

    const brand = await Brand.create(brandOptions);
    return brand;
}

const createProduct = async (productOptions) => {

    const defaultProductOptions = {
        id: '95e12c34-129f-4c91-b03a-2b4c644dbb38',
        cosmetics_brand_id: productOptions.brandId,
        name: 'Product A',
        item_id: '1234',
        usage: {a: 'Some usage'},
        ingredients: 'Some ingredients',
        upc: 'A123',
        size: 'small',
        price: '$100',
        raw_dump: {a: 22},
        categories: {categories: ['perfume']}
    }

    productOptions = {...defaultProductOptions, ...productOptions};

    const product = await Product.create(productOptions);
    return product;
}

const createSource = async (sourceOptions) => {
    const defaultSourceOptions = {
        source_url: 'https://www.sephora.com/product/arancia-di-capri-spray-body-lotion-P443393',
        sourceable_type: 'Product',
        sourceable_id: sourceOptions.productId,
        source_name: Source.Sephora
    }

    sourceOptions = {...defaultSourceOptions, ...sourceOptions};
    const source = await Source.create(sourceOptions);
    return source;
}

const createImage = async (imageOptions) => {
    const defaultImageOptions = {
        image_url: 'https://www.sephora.com/productimages/sku/s1288448-main-Lhero.jpg',
        cosmetics_product_id: imageOptions.productId,
        cosmetics_brand_id: imageOptions.brandId,
        s3_image_url: 'https://staging-lost-grandma-images.s3.us-west-1.amazonaws.com/staging-lost-grandma-images/e47851be-7b16-4e16-b71a-af3055869c45/p450888-av-02-Lhero.jpg',
        azure_image_url: null,
        source: 'sephora'
    }

    imageOptions = {...defaultImageOptions, ...imageOptions};
    const image = await Image.create(imageOptions);
    return image;
}

const createProductSuite = async () => {
    const brand = await createBrand({});
    const product = await createProduct({brandId: brand.id});
    const source =  await createSource({productId: product.id})
    const image = await createImage({brandId: brand.id, productId: product.id})
    return [brand, product, source, image];
}

module.exports.createBrand = createBrand;
module.exports.createProduct = createProduct;
module.exports.createImage = createImage;
module.exports.createSource = createSource;
module.exports.createProductSuite = createProductSuite;

