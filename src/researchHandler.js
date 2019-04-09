import res      from './response'
import got      from 'got'

const debug = require('debug')('gtin-cloud')

class Handlers {
  static async eanDataRequest(ean13) {
    const query = {
      v: 3,
      find: `0000000000000${ean13}`.trim().slice(-13),
      keycode: 'CDED97825A77DBEB',
      mode: 'json'
    }

    const rst = await got('https://eandata.com/feed/', { query })
    debug(rst.body)
    return rst.body
  }

  static async itemMasterRequest(ean13) {
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
  const ean13      = (qs.q || '').trim()

  if (ean13.length < 13) {
    return rspHandler(`${ean13} must be at least 13 characters`, 422)
  }

  if (vendor === 'eandata') {
    const rst = await Handlers.eanDataRequest(ean13)
    return rspHandler(rst)
  } else if (vendor === 'itemmaster') {
    const rst = await Handlers.itemMasterRequest(ean13)
    return rspHandler(rst)
  }

  return rspHandler(`Unknown vendor: ${vendor}`, 422)
}
