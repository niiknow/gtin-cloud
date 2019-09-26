import res      from './response'
import deleteS3 from './deleteS3'
import gtinPath from './gtinPath'

const debug = require('debug')('gtin-cloud')

/**
 * Delete object from storage
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  const qs         = event.queryStringParameters || {}
  const vendor     = (qs.vendor || '').toLowerCase()
  const rspHandler = res(context, callback)
  const gtin       = (event.pathParameters.gtin || '').trim().replace(/[^0-9]*/gi, '')
  const media      = (qs.media || '').trim()

  if (gtin.length < 14) {
    return rspHandler(`${gtin} must be at least 14 characters`, 422)
  }

  debug(`started for ${gtin}`)

  try {
    const basePath = gtinPath(gtin, vendor)
    const key      = (media.length > 0) ?  `${basePath}media/${media}` :`${basePath}index.json`

    return rspHandler(await deleteS3(key))
  } catch (e) {
    debug('get s3 error')
    debug(e)
  }

  return rspHandler(`Unknown vendor: ${vendor}`, 422)
}
