import got        from 'got'
import cherio     from 'cherio'
import gtinPath   from './gtinPath'
import rua        from 'random-useragent'
import scrapeIt   from 'scrape-it'
import storeTasks from './storeTasks'

const debug = require('debug')('gtin-cloud')

const getGoogleProductId = async (gtin) => {
  try {
    const url = `https://www.google.com/search?tbm=shop&tbs=vw:l,new:1&q=${gtin}`
    const rst = await got.get(url, {
      headers: {
        'User-Agent': rua.getRandom(ua => ua.browserName === 'Firefox'),
        'Accept': 'text/html',
        'Accept-Language': 'en-US'
      }
    })

    const re = /<a[^>]+href="\/shopping\/product\/(.*?)"[^>]*>/g
    const m  = re.exec(rst.body)
    if (m[1] && m[1].indexOf('?') > 0) {
      return m[1].split('?')[0]
    }

    return null
  } catch(e) {
    // console.log(e)
    debug(JSON.stringify(e, null, 2))
    return null
  }
}

const scrapeGoogleShopping = async (pid) => {
  try {
    // we want the biggest image possible, otherwise add '/specs' to url
    // to get product Nutritions, Brand, etc..
    const url = `https://www.google.com/shopping/product/${pid}`
    const rst = await got.get(url, {
      headers: {
        'User-Agent': rua.getRandom(ua => ua.browserName === 'Firefox'),
        'Accept': 'text/html',
        'Accept-Language': 'en-US'
      }
    })

    const $ = cherio.load(rst.body)
    const opts = {
      name: '#product-name',
      description: '#product-description-full',
      image_url: {
        selector: '#pp-altimg-init-main img', attr: 'src'
      },
      prices: {
        listItem: '#summary-prices span'
      },
      rank1: {
        selector: '#product-rating-reviews > span',
        eq: 0
      },
      rank2: {
        selector: '#product-rating-reviews > span',
        eq: 1
      },
      rating: {
        selector: '#product-rating > span > div',
        attr: 'aria-label'
      },
      specs: {
        listItem: '#specs .section-inner span'
      },
      attributes: {
        listItem: '.attr-attributes > .shop__secondary > span'
      },
      images: {
        listItem: 'a.sh-mo__image',
        data: {
          url: { attr: 'data-image' },
          type: { attr: 'data-type' },
          index: { attr: 'data-index' }
        }
      }
    }

    const obj = scrapeIt.scrapeHTML($, opts)
    obj.url   = url
    obj.pid   = pid
    return obj

  } catch(e) {
    // console.log(e)
    debug(JSON.stringify(e, null, 2))
    return null
  }
}

const convertGtinToAsin = async (gtin) => {
  try {
    // TODO: fix this
    const url = `https://some.service.that.convert.gtin.to.asin/${gtin}`
    const rst = await got.get(url, {
      headers: {
        'User-Agent': rua.getRandom(ua => ua.browserName === 'Firefox'),
        'Accept': 'text/html',
        'Accept-Language': 'en-US'
      }
    })

    return rst.body
  } catch(e) {
    // console.log(e)
    debug(JSON.stringify(e, null, 2))
    return null
  }
}

const scrapeAmazon = async (asin) => {
  try {
    // we want the biggest image possible, otherwise add '/specs' to url
    // to get product Nutritions, Brand, etc..
    const url = `https://www.amazon.com/dp/${asin}`
    const rst = await got.get(url, {
      headers: {
        'User-Agent': rua.getRandom(ua => ua.browserName === 'Firefox'),
        'Accept': 'text/html',
        'Accept-Language': 'en-US'
      }
    })

    const $ = cherio.load(rst.body)
    const opts =  {
      title: '#productTitle',
      sale_price: 'tr#priceblock_ourprice_row td.a-span12 span#priceblock_ourprice',
      sale_price_desc: 'tr#priceblock_ourprice_row span.a-size-small.a-color-price',
      deal_price: 'span#priceblock_dealprice',
      seller_price: {
        selector: 'div#toggleBuyBox span.a-color-price',
        convert: x => {
          if (x.charAt(0) === '$') {
            return x.slice(1);
          }
          return x;
        }
      },
      mrpp: 'div#price span.a-text-strike',
      savings: 'tr#regularprice_savings td.a-span12.a-color-price.a-size-base',
      brand: 'div#bylineInfo_feature_div a#bylineInfo',
      vat: 'tr#vatMessage',
      availiability: 'div#availability',
      vnv: 'div#vnv-container',
      features: {
        listItem: 'div#feature-bullets ul li',
        name: 'features',
        data: {
          feature: 'span.a-list-item'
        }
      },
      images: {
        listItem: 'div#imageBlock div#altImages ul li',
        name: 'altImages',
        data: {
          url: {
            selector: 'img',
            attr: 'src',
            convert: x => x.replace(/_[S][A-Z][0-9][0-9]_./g, '')
          }
        }
      },
      brand_url: {
        selector: 'div#bylineInfo_feature_div a#bylineInfo',
        attr: 'href'
      },
      image_url: {
        selector: 'img#landingImage',
        attr: 'src'
      }
    }

    const obj = scrapeIt.scrapeHTML($, opts)
    obj.url   = url
    obj.asin  = asin
    return obj

  } catch(e) {
    // console.log(e)
    debug(JSON.stringify(e, null, 2))
    return null
  }
}

class Handlers {
  static async amazonRequest(gtin, storeData = false, imageUrl = null) {
    try {
      const asin = await convertGtinToAsin(gtin)
      let obj    = null

      if (asin && asin.length > 0) {
        obj           = await scrapeAmazon(asin)
        obj.gtin      = gtin
        obj.gtin_path = gtinPath(gtin)
        obj._ts       = (new Date()).toISOString()
        obj.image     = imageUrl || obj.image_url

        if (storeData) {
          // stash the data and image
          const rsp = storeTasks(gtin, obj.image, 'image', JSON.stringify(obj), 'amazonweb')
          if (rsp.tasks) {
            await Promise.all(rsp.tasks)
          }
        }
      } else {
        return `${gtin} not found`
      }

      debug(`completed ${gtin}`)
      return obj
    } catch (e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async googleshoppingRequest(gtin, storeData = false, imageUrl = null) {
    try {
      // convert gtin to asin
      const pid = await getGoogleProductId(gtin)
      let obj   = null

      if (pid && pid.length > 0) {
        obj           = await scrapeGoogleShopping(pid)
        obj.gtin      = gtin
        obj.gtin_path = gtinPath(gtin)
        obj._ts       = (new Date()).toISOString()
        obj.image     = imageUrl || obj.image_url

        if (storeData) {
          // stash the data and image
          const rsp = storeTasks(gtin, obj.image, 'image', JSON.stringify(obj), 'googleshopping')
          if (rsp.tasks) {
            await Promise.all(rsp.tasks)
          }
        }
      } else {
        return `${gtin} not found`
      }

      debug(`completed ${gtin}`)
      return obj
    } catch (e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }
}

export const handlers = Handlers
