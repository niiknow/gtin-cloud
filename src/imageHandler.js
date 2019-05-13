import res        from './response'
import realGtin   from './realGtin'
import gtinPath   from './gtinPath'
import isNational from './isNational'
import got        from 'got'

const debug   = require('debug')('gtin-cloud')
const baseUrl = process.env.CDN_BASE

/**
 * Handle returning of image url by gtin
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  const gtin       = (event.pathParameters.gtin || '').trim()
  const qs         = event.queryStringParameters || {}
  const client     = (event.pathParameters.client || '').toLowerCase()
  const rspHandler = res(context, callback)
  const nocheck    = !!(qs.nocheck || false)
  // nocheck - do not enforce use of check digit

  if (gtin.length < 14) {
    return rspHandler(`${gtin} must be at least 14 characters`, 422)
  }

  debug(`started for ${gtin}`)
  const rgtin   = realGtin(gtin)
  const tasks   = []
  const headers = { method: 'head' }
  let imageUrl  = null

  // do not use check digit for local or nocheck is provided
  if (isNational(rgtin)) {
    // default, search with rgtin - return client image first
    tasks.push(got(baseUrl + gtinPath(nocheck ? gtin : rgtin, client) + 'index.jpg', headers))
    tasks.push(got(baseUrl + gtinPath(nocheck ? gtin : rgtin, '') + 'index.jpg', headers))
  } else {
    // search local only for local gtin
    tasks.push(got(baseUrl + gtinPath(gtin, client) + 'index.jpg', headers))
  }

  const rsts = await Promise.all(tasks.map(p => p.catch(e => e)))
  rsts.forEach((item, i) => {
    if (imageUrl) {
      return
    }

    if (item.statusCode === 200) {
      imageUrl = item.url
    }
  })

  rspHandler(imageUrl, imageUrl ? 302 : 404)

  return imageUrl
}
