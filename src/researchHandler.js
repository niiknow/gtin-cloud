import res      from './response'
import got      from 'got'
import xmljs    from 'xml-js'

const debug = require('debug')('gtin-cloud')

class Handlers {
  static async eanDataRequest(gtin) {
    const query = {
      v: 3,
      find: `0000000000000${gtin}`.slice(-13),
      keycode: 'CDED97825A77DBEB',
      mode: 'json'
    }

    const rst = await got('https://eandata.com/feed/', { query })
    debug(rst.body)
    return rst.body
  }

  static async itemMasterRequest(gtin) {
    gtin = `0000000000000${gtin}`.slice(-14)

    const url = `https://api.itemmaster.com/v2.2/item/`

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

    const rst  = await got(url, { query, headers })
    const json = xmljs.xml2json(rst.body, {
      compact: true,
      ignoreDeclaration: true
    })
    const obj = JSON.parse(json)
    const itemJson = JSON.stringify(obj.items.item)
    // console.log(JSON.stringify(obj.items.item, null, 2))
    debug(itemJson)
    return itemJson
  }

  static async kwikeeRequest(ean13) {

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
    return rspHandler(`${ean13} must be at least 14 characters`, 422)
  }

  if (vendor === 'eandata') {
    const rst = await Handlers.eanDataRequest(gtin)
    return rspHandler(rst)
  } else if (vendor === 'itemmaster') {
    const rst = await Handlers.itemMasterRequest(gtin)
    return rspHandler(rst)
  } else if (vendor === 'kwikee') {
    const rst = await Handlers.kwikeeRequest(gtin)
    return rspHandler(rst)
  }

  return rspHandler(`Unknown vendor: ${vendor}`, 422)
}
