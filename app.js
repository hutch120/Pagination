'use strict'

/* eslint */
/* global _, $, performance */

// Simple emulation of a redux style single global application state. Typically use library.
var gData = {
  baseURL: 'https://jsonp.afeld.me/?url=http://wp8m3he1wt.s3-website-ap-southeast-2.amazonaws.com', // Proxy to get around cors issues from browser.
  productListInitial: '/api/products/1',
  productsAll: [], // But might be nice for some caching function. Clearly we don't need to store this if memory is an issue.
  productsAC: [],
  resultsHTML: ''
}

/**
 * App
 */
function App () {
  // Adapters
  var adapters = {
    'run': function () {
      return run()
    }
  }

  /**
   * Run test
   */
  var run = function () {
    console.log('run: Start')
    var t0 = performance.now()
    $('#results').html('')
    gData.productsAll = []
    gData.productsAC = []
    return _getAllProducts().then(_parseProducts).then(function () {
      var t1 = performance.now()
      var runtimeSeconds = _.round((t1 - t0) / 1000, 5)
      console.log('run: Done. Run took ' + runtimeSeconds + ' seconds.')
      $('#results').append('<br/><br/>Runtime <b>' + runtimeSeconds + '</b> seconds')
    }).catch(function (err) {
      console.error('run: Error', err)
    })
  }

  async function _getAllProducts () {
    var done = false
    var nextProductListURL = gData.productListInitial // /api/products/1
    while (!done) {
      if (nextProductListURL) {
        console.log('_getAllProducts: nextProductListURL', nextProductListURL)
        nextProductListURL = await _getProductList(nextProductListURL)
      } else {
        done = true
        console.log('_getAllProducts: All products retrieved')
      }
    }
    return gData.productsAll
  }

  var _getProductList = function (url) {
    return new Promise(resolve => {
      url = gData.baseURL + url
      var nextProductListURL = ''
      $('#results').append('<br/>Get data <b>' + _.replace(url, gData.baseURL, '') + '</b>')
      $.getJSON(url, function (data) {
        nextProductListURL = _.get(data, 'next', null)
        gData.productsAll = _.concat(gData.productsAll, data.objects)
        return resolve(nextProductListURL)
      })
    })
  }

  var _parseProducts = function () {
    console.log('_parseProducts: productsAll', gData.productsAll)
    gData.productsAC = _.filter(gData.productsAll, function (o) {
      return o.category === 'Air Conditioners'
    })
    $('#results').append('<br/><br/>Found <b>' + gData.productsAll.length + '</b> products of which <b>' + gData.productsAC.length + '</b> are Air Conditioners')
    $('#results').append('<br/><br/>Air Conditioners list')
    gData.productsAC.forEach(function (element) {
      var cubicM = (element.size.height / 100) * (element.size.length / 100) * (element.size.width / 100)
      element.cubicM = cubicM
      var cubicWeightKG = cubicM * 250
      element.cubicWeight = cubicWeightKG
      $('#results').append('<br/>Item: <b>' + element.title + '</b> - Cubic weight: <b>' + _.round(cubicWeightKG, 5) + 'kg</b>')
    })

    console.log('_parseProducts: productsAC', gData.productsAC)
  }

  // Return adapters (must be at end of adapter)
  return adapters
}

window.exports = App
// End Adapter

$(document).ready(function () {
  $('#test').on('click', App().run)
  console.log('Click the test button or type App().run() in console to start.')
})
