import got      from 'got'
import xmljs    from 'xml-js'
import res      from './response'
import storeTasks from './storeTasks'

const debug = require('debug')('gtin-cloud')

class Handlers {
  static async eanDataRequest(gtin, stashData = false) {
    const query = {
      v: 3,
      find: `0000000000000${gtin}`.slice(-13),
      keycode: process.env.EANDATA_KEY,
      mode: 'json'
    }
    let type = 'none'

    try {
      const rst = await got('https://eandata.com/feed/', { query })
      const obj = JSON.parse(rst.body)

      // console.log(obj)
      // debug(itemJson)
      if (stashData && obj.product) {
        // stash the data and image
        const rsp = storeTasks(gtin, obj.product.image, 'image', rst.body, 'eandata')
        if (rsp.tasks) {
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return rst.body
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return JSON.stringify({ error: 'request error' })
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

      const obj    = JSON.parse(json)
      let image    = null
      let itemJson = null;

      if (obj.items && obj.items.item) {
        itemJson = JSON.stringify(obj.items.item)

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
        // console.log(image)

        debug(itemJson)
        if (stashData) {
          // stash the data and image
          const rsp = storeTasks(gtin, image, 'image', itemJson, 'itemmaster', null, { headers })
          if (rsp.tasks) {
            await Promise.all(rsp.tasks)
          }
        }
      }

      debug(`completed ${gtin}`)
      return itemJson
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return JSON.stringify({ error: 'request error' })
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
      const data  = JSON.parse(rsts[0].body)
      const idata = JSON.parse(rsts[1].body)
      let image   = null

      if (idata.kwikeeApiV3 && idata.kwikeeApiV3.gtin)
      {
        data.images = idata.kwikeeApiV3.gtin
        image = data.images[0].mainImageAsset.files[0].url
      }

      const jsonData = JSON.stringify(data)

      if (stashData) {
        // console.log(image)
        const rsp = storeTasks(gtin, image, 'image', jsonData, 'kwikee', `${gtin}.jpg`, { headers })
        // console.log(rsp)
        if (rsp.tasks) {
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return jsonData
    } catch(e) {
      // console.log(e)
      debug(JSON.stringify(e, null, 2))
      return JSON.stringify({ error: 'request error' })
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

  if (gtin.length < 14) {
    return rspHandler(`${gtin} must be at least 14 characters`, 422)
  }

  debug(`started for ${gtin}`)

  if (vendor === 'eandata') {
    const rst = await Handlers.eanDataRequest(gtin, true)
    return rspHandler(rst)
  } else if (vendor === 'itemmaster') {
    const rst = await Handlers.itemMasterRequest(gtin, true)
    return rspHandler(rst)
  } else if (vendor === 'kwikee') {
    const rst = await Handlers.kwikeeRequest(gtin, true)
    return rspHandler(rst)
  }

  debug(`unknown vendor ${vendor}`)

  return rspHandler(`Unknown vendor: ${vendor}`, 422)
}
