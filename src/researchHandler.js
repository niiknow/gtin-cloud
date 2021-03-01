import res       from './response'
import getS3     from './getS3'
import primary   from './primaryVendors'
import website   from './websiteVendors'
import secondary from './secondaryVendors'

const debug = require('debug')('gtin-cloud')

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
  const gtin       = (qs.q || '').trim().replace(/[^0-9]*/gi, '')
  const force      = !!(qs.force || false)
  const nostore    = !!(qs.nostore || false)
  const imageUrl   = qs.url
  // force - to force fresh data, do not use cache
  // nostore - true to not save fresh data to cache

  // make it 12 digits to allow for UPC
  if (gtin.length < 12) {
    return rspHandler(`${gtin} must be at least 12 characters`, 422)
  }

  debug(`started for ${gtin} ${vendor}`)
  let data   = null
  let myGtin = `00000000000000${gtin}`.slice(-14)

  // if force, then we do not want to use cache
  // else, we always try to cache first
  if (!force) {
    try {
      data = await getS3(myGtin, vendor)
      if (data) {
        return rspHandler(data)
      }
    } catch (e) {
      debug('get s3 error')
      debug(e)
    }
  }

  try {
    // json stringify because we expect an object
    if (vendor === 'syndigo') {
      const rst = await primary.syndigoRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    } else if (vendor === 'kwikee') {
      const rst = await primary.kwikeeRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    } else if (vendor === 'itemmaster') {
      const rst = await primary.itemMasterRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    } else if (vendor === 'datakick') {
      const rst = await primary.datakickRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    } else if (vendor === 'eandata') {
      const rst = await primary.eanDataRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    } else if (vendor === 'tesco') {
      const rst = await primary.tescoRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    } else if (vendor === 'openfoodfacts') {
      const rst = await primary.openfoodfactsRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    }

    // handle secondary vendors
    if (vendor === 'digiteyes') {
      const rst = await secondary.digiteyesRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    } else if (vendor === 'googleshopping') {
      const rst = await website.googleshoppingRequest(gtin, !nostore, imageUrl)
      return rspHandler(rst)
    }

  } catch (e) {
    return rspHandler({ error: e })
  }

  debug(`unknown vendor ${vendor}`)

  return rspHandler(`Unknown vendor: ${vendor}`, 422)
}
