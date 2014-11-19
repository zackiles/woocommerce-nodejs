woocommerce-nodejs
==================

Some utility functions to use with the WooCommerce API and NodeJS. Each function can also take a filter. I have two filters right now, saveProductFilter and extendProductFilter. saveProduct will dump the results of any function to file in JSON. extendProductFilter will attach metadata to each product, like customer reviews, etc.

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
