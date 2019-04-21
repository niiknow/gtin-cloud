import got      from 'got'
import cherio   from 'cherio'
import gtinPath from './gtinPath'
import rua      from 'random-useragent'
import scrapeIt from 'scrape-it'

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

    const re = /<a[^>]+href=\"\/shopping\/product\/(.*?)\"[^>]*>/g
    const m  = re.exec(rst.body)
    if (m[1]) {
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
    // to get product Ingredients, Warnings, Nutritions, Brand, etc..
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

class Handlers {
  static async googleRequest(gtin, storeData = false, imageUrl = null) {
    try {
      const pid = await getGoogleProductId(gtin)
      let obj = null

      if (pid && pid.length > 0) {
        obj           = await scrapeGoogleShopping(pid)
        obj.gtin      = gtin
        obj.gtin_path = gtinPath(gtin)
        obj._ts       = (new Date()).toISOString()
        obj.image     = imageUrl || obj.image_url
      } else {
        return `${gtin} not found`
      }

      return obj
    } catch (e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }
}

export const handlers = Handlers
