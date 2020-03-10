import got        from 'got'
import xmljs      from 'xml-js'
import storeTasks from './storeTasks'
import gtinPath   from './gtinPath'

const debug = require('debug')('gtin-cloud')

class Handlers {
  static async datakickRequest(gtin, storeData = false, imageUrl = null) {
    try {
      const rst = await got(`https://www.datakick.org/api/items/${gtin}`)
      // debug(rst.body)

      const obj     = JSON.parse(rst.body)
      obj.gtin      = gtin
      obj.gtin_path = gtinPath(gtin)
      obj._ts       = (new Date()).toISOString()
      let image     = imageUrl

      if (!obj.gtin14) {
        return { error: 'request error', response: rst.body }
      }

      if (image === null && obj.images[0]) {
        image     = obj.images[0].url
        obj.image = image
      }

      // console.log(obj)
      // debug(itemJson)
      if (storeData) {
        // stash the data and image
        const rsp = storeTasks(gtin, image, 'image', JSON.stringify(obj), 'datakick')
        if (rsp.tasks) {
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return obj
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async eanDataRequest(gtin, storeData = false, imageUrl = null) {
    const query = {
      v: 3,
      find: `0000000000000${gtin}`.slice(-13),
      keycode: process.env.EANDATA_KEY,
      mode: 'json'
    }

    try {
      const rst = await got('https://eandata.com/feed/', { query })
      // debug(rst.body)

      const obj   = JSON.parse(rst.body)
      let product = null

      if (!obj.product) {
        return { error: 'request error', response: rst.body }
      }
      product           = obj.product
      product.gtin      = gtin
      product.gtin_path = gtinPath(gtin)
      product._ts       = (new Date()).toISOString()

      if (product.attributes.product !== 'Unknown') {
        debug(`found ${gtin}`)
        product.image = imageUrl || product.image

        // console.log(obj)
        // debug(itemJson)
        if (storeData) {
          // stash the data and image
          const rsp = storeTasks(gtin, product.image, 'image', JSON.stringify(product), 'eandata')
          if (rsp.tasks) {
            await Promise.all(rsp.tasks)
          }
        }

      }

      debug(`completed ${gtin}`)
      return product || `${gtin} not found`
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async itemMasterRequest(gtin, storeData = false, imageUrl = null, manufacturer = null) {
    gtin = `0000000000000${gtin}`.slice(-14)

    const url = 'https://api.itemmaster.com/v2.2/item/'

    const headers = {
      username: process.env.IM_USER,
      password: process.env.IM_PASS
    }

    const query = {
      upc: gtin,
      ef: 'jpg',
      eip: 72,
      epf: 1000,
      allImg: 'Y'
    }

    if (manufacturer) {
      query.m = manufacturer
    }

    try {
      debug(`begin ${gtin}`, query)
      const rst  = await got(url, { query, headers })
      const json = xmljs.xml2json(rst.body, {
        compact: true,
        ignoreDeclaration: true
      })

      const obj     = JSON.parse(json)
      let product   = null
      let image     = imageUrl

      if (obj.items && obj.items.item) {
        // console.log(JSON.stringify(obj.items.item, null, 2))
        product = obj.items.item

        if (image === null && product.media) {
          const medias = product.media.medium || product.media

          if (Array.isArray(medias)) {
            medias.forEach((media) => {
              // console.log(media)
              if (media._attributes.view === 'E_A1A3_1000x1000') {
                image = media.url._text
              }
            })
          } else if (medias.url) {
            image = medias.url._text
          }
        }

        product.gtin      = gtin
        product.image     = image
        product.gtin_path = gtinPath(gtin)
        product._ts       = (new Date()).toISOString()

        if (storeData) {
          // stash the data and image
          const rsp = storeTasks(gtin, image, 'image', JSON.stringify(product), 'itemmaster', null, { headers })
          if (rsp.tasks) {
            await Promise.all(rsp.tasks)
          }
        }
      } else {
        debug(json)
        return `${gtin} not found`
      }

      debug(`completed ${gtin}`)
      return product ? product : `${gtin} empty result`
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async kwikeeRequest(gtin, storeData = false, imageUrl = null) {

    gtin = `0000000000000${gtin}`.slice(-14)

    const url  = `https://api.kwikee.com/public/v3/data/gtin/${gtin}`
    const iurl = `https://api.kwikee.com/public/v3/images/ecom/gtin/${gtin}`
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.KWIKEE_KEY
    }

    try {
      const r1      = got(url, { headers })
      const r2      = got(iurl, { headers })
      const rsts    = await Promise.all([r1, r2])
      const obj     = JSON.parse(rsts[0].body)
      const idata   = JSON.parse(rsts[1].body)
      obj.gtin      = gtin
      obj.media     = idata
      obj.gtin_path = gtinPath(gtin)
      obj._ts       = (new Date()).toISOString()
      let image     = imageUrl

      if (image === null && idata.kwikeeApiV3 && idata.kwikeeApiV3.gtin)
      {
        obj.media = idata.kwikeeApiV3.gtin[0] || idata.kwikeeApiV3.gtin
        if (obj.media.mainImageAsset && obj.media.mainImageAsset.files[0]) {
          image = obj.media.mainImageAsset.files[0].url
        }
      }

      obj.image = image

      if (storeData) {
        // console.log(image)
        const rsp = storeTasks(gtin, image, 'image', JSON.stringify(obj), 'kwikee', `${gtin}.jpg`, { headers })
        // console.log(rsp)
        if (rsp.tasks) {
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return obj
    } catch(e) {
      // console.log(e)
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async tescoRequest(gtin, storeData = false, imageUrl = null) {

    gtin = `0000000000000${gtin}`.slice(-14)

    const ean  = gtin.slice(-13)
    const url  = `https://dev.tescolabs.com/product/?gtin=${gtin}`
    const iurl = imageUrl || `https://img.tesco.com/Groceries/pi/${ean.slice(-3)}/${ean}/IDShot_540x540.jpg`
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.TESCO_KEY
    }

    try {
      // get product data
      // check if image exists by EAN pattern
      const r1   = got(url, { headers })
      const r2   = got(iurl, { method: 'head' })
      const rsts = await Promise.all([r1, r2])
      const obj  = JSON.parse(rsts[0].body).products[0]

      if (obj) {
        obj.gtin      = gtin
        obj.gtin_path = gtinPath(gtin)
        obj._ts       = (new Date()).toISOString()

        if (rsts[1].statusCode !== 404) {
          obj.image = iurl
        }

        if (storeData) {
          // console.log(image)
          const rsp = storeTasks(gtin, obj.image, 'image', JSON.stringify(obj), 'tesco', `${gtin}.jpg`)
          // console.log(rsp)
          if (rsp.tasks) {
            await Promise.all(rsp.tasks)
          }
        }
      } else {
        return `${gtin} not found`
      }

      debug(`completed ${gtin}`)
      return obj
    } catch(e) {
      // console.log(e)
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async openfoodfactsRequest(gtin, storeData = false, imageUrl = null) {
    try {
      const rst = await got(`https://world.openfoodfacts.org/api/v0/product/${gtin}.json`)
      // debug(rst.body)

      const obj = JSON.parse(rst.body).product

      if (!obj) {
        return `${gtin} not found`
      }

      obj.gtin      = gtin
      obj.gtin_path = gtinPath(gtin)
      obj._ts       = (new Date()).toISOString()
      obj.image     = imageUrl || obj.image_url

      // console.log(obj)
      // debug(itemJson)
      if (storeData) {
        // stash the data and image
        const rsp = storeTasks(gtin, obj.image, 'image', JSON.stringify(obj), 'openfoodfacts')
        if (rsp.tasks) {
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return obj
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }
}

export default Handlers
