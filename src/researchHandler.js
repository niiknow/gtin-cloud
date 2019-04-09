import res      from './response'
import got      from 'got'

const debug = require('debug')('gtin-cloud')

class Handlers {
  static async handleEanData(ean13) {
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
}

export const handlers = Handlers

/**
 * Proxy request to external vendor for GTIN data
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export const handleEanData = async (event, context, callback) => {
  const qs         = event.queryStringParameters || {}
  const vendor     = (qs.vendor || '')
  const rspHandler = res(context, callback)

  if (vendor === 'eandata') {
    const ean13 = (qs.q || '').trim()

    if (ean13.length < 13) {
      rspHandler(`${ean13} must be at least 13 characters`, 422)
    }

    const rst   = await Handlers.handleEanData(ean13)
    return rspHandler(rst)
  }

  return rspHandler(`Unknown vendor: ${vendor}`, 422)
}
