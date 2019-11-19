# Useful tidbits

### 1. Join queries with conditions

```
const op = Sequelize.Op;
const options = {
    includedModels: [
        
        { model: Image, 
          required: true, 
          where: {s3_image_url: {[op.is]: null}} 
        }, { 
           model: Brand, 
           required: true 
        }
    ]
}
findInBatches(Product, 1000, onEachBatch, options).then(() => { console.log('Done here.')})
function onEachBatch(products) {
    console.log(products);
};

```

This triggers an inner join query. 

`required: false` will yield a left-outer join query.
