var config = require('./config'),
    unirest = require('unirest'),
    Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    extend = require('node.extend');
var mkdirp = Q.denodeify(require('mkdirp'));
var writeFile = Q.denodeify(fs.writeFile);
var S = require('string');

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

// PRODUCT ITERATOR FILTERS
var filters = {
  extendProductFilter : function (product, callback){
    var defer = Q.defer();
    getProductReviewsById(product.id)
    .then(function(reviews){
      product.reviews = reviews;
      return getProductMetaData(product);
    })
    .then(function(metadata){
       console.log('Extended product id:', product.id);
      return defer.resolve(extend(true, product, metadata));
    }).catch(defer.reject).done();
    return defer.promise.nodeify(callback);
  },

  saveProductFilter: function(product, callback) {
    var defer = Q.defer();
    mkdirp(config.productsDir)
    .then(function(dir){
      var fName = path.join(dir, product.slug + '.json');
      return writeFile(fName, JSON.stringify(product, null, 1));
    })
    .then(function(f){
      console.log('Wrote product:', product.slug, 'to disk.');
      return defer.resolve(product);
    })
    .catch(function(err){
      return defer.reject(err);
    })
    .done();
    return defer.promise.nodeify(callback);
  }
};

function filterCollection(collection, filter, callback) {
  var defer = Q.defer();
  collection = collection.slice(0);
  var filteredCollection = [];
  (function step() {
    if(collection.length == 0){defer.resolve(filteredCollection); return;}
    else{
      var _entry = collection.splice(0, 1)[0];
      if(filter){

        filter(_entry)
          .catch(function(err){
            if(err){console.error(err);}
            console.error('Could not filter:', _entry);
          })
          .done(function(entry){
            if(entry){filteredCollection.push(entry);}
            step();
          });
      }else{filteredCollection.push(_entry);step();}
    }
  })();
  return defer.promise.nodeify(callback);
}
function getProductPage(page, resourceUri, callback) {
  var defer = Q.defer(), url = require('url'), params;
  if(!resourceUri){resourceUri='';}
  params='?page='+page.toString()+'&filter[meta]=true';
  unirest.get(url.resolve(config.woocommerce.productsUrl, resourceUri + params))
  .header({'Accepts': 'application/json'})
  .auth(config.woocommerce.consumerKey, config.woocommerce.consumerSecret, true)
  .as.json(function (response) {
    if (!response.body){return defer.reject(response);}
    if (response.body.errors){return defer.resolve({});}
    defer.resolve(response.body.products);
  });
  return defer.promise.nodeify(callback);
}

function getProducts(resourceUri, callback) {
  var defer = Q.defer();
  if(!resourceUri){resourceUri='';}
  var currentPage = 1;
  var products = [];
  (function step() {
    getProductPage(currentPage, resourceUri)
    .then(function(p){
      defer.notify('Loading product page: ' + currentPage.toString());
      if(!p){return defer.resolve(products);}
      if(p.length == 0){return defer.resolve(products);}
      else{for (var i = 0; i < p.length; i++){
        defer.notify('Found product: ' + p[i].id.toString());
        products.push(p[i]);
      }} currentPage++;step();
    })
    .delay(5000)
    .catch(defer.reject)
    .done();
  })();
  return defer.promise.nodeify(callback);
}

function getProductCount(callback) {
  var defer = Q.defer();
  unirest.get(config.woocommerce.productsUrl + 'count')
  .auth(config.woocommerce.consumerKey, config.woocommerce.consumerSecret, true)
  .end(function (response) {
    if (response.body.errors) {return defer.reject(response.body.status);}
    defer.resolve(response.body.count);
  });
  return defer.promise.nodeify(callback);
}

function getProductReviewsById(id, callback) {
  var defer = Q.defer(), url = require('url');
  unirest.get(url.resolve(config.woocommerce.productsUrl, id.toString() + '/reviews/'+'?filter[meta]=true'))
    .header({'Accepts': 'application/json'})
    .auth(config.woocommerce.consumerKey, config.woocommerce.consumerSecret, true)
    .as.json(function(res){
      if(res.body && res.body.product_reviews){defer.resolve(res.body.product_reviews);}
      else{defer.resolve({});}
    });
  return defer.promise.nodeify(callback);
}

function getProductById(id, callback) {
  var defer = Q.defer();
  unirest.get(config.woocommerce.productsUrl + id.toString() + '/')
  .header({'Accepts': 'application/json'})
  .auth(config.woocommerce.consumerKey, config.woocommerce.consumerSecret, true)
  .as.json(function (response) {
    if (!response.body){return defer.reject(response);}
    if (response.body.errors){return defer.resolve({});}
    if (!response.body.product){return defer.reject(response);}
    defer.resolve(response.body.product);
  });
  return defer.promise.nodeify(callback);
}

function getProductFullById(id, callback) {
  var defer = Q.defer(), product = {};
  getProductById(id).then(function(p){
    product=p;
    return getProductReviewsById(product.id);
  })
  .then(function(r){
    product.reviews=r;
    defer.resolve(product);
  })
  .catch(defer.reject)
  .done();
 return defer.promise.nodeify(callback);
}

function getProductMetaData(product, callback){
  var defer = Q.defer();
  unirest.get('http://liftmj.com/product/' + product.permalink + '?json=1')
  .header({'Accepts': 'application/json'})
  .as.json(function (response) {
    if (!response.body){return defer.reject(response);}
    if (response.body.post){defer.resolve(response.body.post);}
    else{defer.resolve({});}
  });
  return defer.promise.nodeify(callback);
}
