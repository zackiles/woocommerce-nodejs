woocommerce-nodejs
==================

Some utility functions to use with the WooCommerce API and NodeJS. Each function can also take a filter. I have two filters right now, saveProductFilter and extendProductFilter. saveProduct will dump the results of any function to file in JSON. extendProductFilter will attach metadata to each product, like customer reviews, etc.

Each function can be used with a normal Node style callback, or a promise wrapped with Q. The examples below use Q.

Set config.js with the relevant API keys for WooCommerce.

***EXPORTS***
```
module.exports = {
  filters : filters,
  filterCollection : filterCollection,
  getProductCount : getProductCount,
  getProducts : getProducts,
  getProductReviewsById : getProductReviewsById,
  getProductById : getProductById,
  getProductFullById : getProductFullById,
  getProductMetaData : getProductMetaData
};
```

***EXAMPLE***
- General
```
// grab all strain products from liftmj's woocommerce
WooUtil.getProducts()

// extend the strain products with extra metadata found in wordpress posts, reviews, and comments
.then(extendProducts)

// write the strain products to disk
.then(saveProducts)

.catch(console.error)
.done(function(result){
  console.log(result);
});
```
- Filters
```
var saveProducts = function(products){
  console.log('Writing', products.length,' products to disk');
  return WooUtil.filterCollection(products, WooUtil.filters.saveProductFilter);
};

var extendProducts = function(products){
  console.log('Extending product meta data');
  return WooUtil.filterCollection(products, WooUtil.filters.extendProductFilter);
};
```


