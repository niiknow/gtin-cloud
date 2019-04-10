import got      from 'got'
import xmljs    from 'xml-js'
import res      from './response'
import storeTasks from './storeTasks'

const debug = require('debug')('gtin-cloud')

class Handlers {
  static async datakickRequest(gtin, stashData = false) {
    try {
      const rst = await got(`https://www.datakick.org/api/items/${gtin}`)
      debug(rst.body)

      const obj = JSON.parse(rst.body)
      let image   = null

      if (!obj.gtin14) {
        return { error: 'request error', response: rst.body }
      }

      if (obj.images[0]) {
        image = obj.images[0].url
      }


      // console.log(obj)
      // debug(itemJson)
      if (stashData) {
        // stash the data and image
        const rsp = storeTasks(gtin, image, 'image', JSON.stringify(obj), 'datakick')
        if (rsp.tasks) {
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return product || `${gtin} not found`
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async eanDataRequest(gtin, stashData = false) {
    const query = {
      v: 3,
      find: `0000000000000${gtin}`.slice(-13),
      keycode: process.env.EANDATA_KEY,
      mode: 'json'
    }

    try {
      const rst = await got('https://eandata.com/feed/', { query })
      debug(rst.body)

      const obj = JSON.parse(rst.body)
      let product = null

      if (!obj.product) {
        return { error: 'request error', response: rst.body }
      }

      if (obj.product.attributes.product !== 'Unknown') {
        debug(`found ${gtin}`)
        product = obj.product

        // console.log(obj)
        // debug(itemJson)
        if (stashData) {
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

  static async itemMasterRequest(gtin, stashData = false) {
    gtin = `0000000000000${gtin}`.slice(-14)

    const url = 'https://api.itemmaster.com/v2.2/item/'

    const headers = {
      username: process.env.IM_USER,
      password: process.env.IM_PASS
    }

    const query = {
      upc: gtin,
      ef: 'jpg',
      eip: 75,
      epf: 1000,
      allImg: 'Y'
    }

    try {
      const rst  = await got(url, { query, headers })
      const json = xmljs.xml2json(rst.body, {
        compact: true,
        ignoreDeclaration: true
      })

      const obj = JSON.parse(json)
      let image = null

      if (obj.items && obj.items.item) {
        // console.log(JSON.stringify(obj.items.item, null, 2))

        if (obj.items.item.media) {
          const medias = obj.items.item.media.medium

          if (Array.isArray(medias)) {
            medias.forEach((media) => {
              // console.log(media)
              if (media._attributes.view === 'E_A1A3_1000x1000') {
                image = media.url._text
              }
            })
          } else if (medias) {
            image = media.url._text
          }
        }

        if (stashData) {
          // stash the data and image
          const rsp = storeTasks(gtin, image, 'image', JSON.stringify(obj.items.item), 'itemmaster', null, { headers })
          if (rsp.tasks) {
            await Promise.all(rsp.tasks)
          }
        }
      }

      debug(`completed ${gtin}`)
      return obj.items.item || `${gtin} not found`
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async kwikeeRequest(gtin, stashData = false) {

    gtin = `0000000000000${gtin}`.slice(-14)

    const url  = `https://api.kwikee.com/public/v3/data/gtin/${gtin}`
    const iurl = `https://api.kwikee.com/public/v3/images/ecom/gtin/${gtin}`
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.KWIKEE_KEY
    }

    try {
      const r1    = got(url, { headers })
      const r2    = got(iurl, { headers })
      const rsts  = await Promise.all([r1, r2])
      const obj   = JSON.parse(rsts[0].body)
      const idata = JSON.parse(rsts[1].body)
      let image   = null

      if (idata.kwikeeApiV3 && idata.kwikeeApiV3.gtin)
      {
        obj.media = idata.kwikeeApiV3.gtin
        image     = obj.media[0].mainImageAsset.files[0].url
      }

      if (stashData) {
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
}

export const handlers = Handlers

/**
 * Proxy request to external vendor for GTIN data
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  const qs         = event.queryStringParameters || {}
  const vendor     = (event.pathParameters.vendor || '').toLowerCase()
  const rspHandler = res(context, callback)
  const gtin       = (qs.q || '').trim()
  const stash      = (qs.stash || false)

  if (gtin.length < 14) {
    return rspHandler(`${gtin} must be at least 14 characters`, 422)
  }

  debug(`started for ${gtin}`)

  // json stringify because we expect an object
  if (vendor === 'datakick') {
    const rst = await Handlers.datakickRequest(gtin, !!stash)
    return rspHandler(rst)
  } else if (vendor === 'eandata') {
    const rst = await Handlers.eanDataRequest(gtin, !!stash)
    return rspHandler(rst)
  } else if (vendor === 'itemmaster') {
    const rst = await Handlers.itemMasterRequest(gtin, !!stash)
    return rspHandler(rst)
  } else if (vendor === 'kwikee') {
    const rst = await Handlers.kwikeeRequest(gtin, !!stash)
    return rspHandler(rst)
  }

  debug(`unknown vendor ${vendor}`)

  rspHandler(`Unknown vendor: ${vendor}`, 422)
}
