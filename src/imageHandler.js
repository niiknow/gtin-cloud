import res        from './response'
import realGtin   from './realGtin'
import gtinPath   from './gtinPath'
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
  const gtin       = (event.pathParameters.gtin || '').trim().replace(/[^0-9A-Z]*/g, '')
  const client     = (event.pathParameters.client || '').trim().toLowerCase()
  const rspHandler = res(context, callback)

  if (gtin.length < 14) {
    return rspHandler(`${gtin} must be at least 14 characters`, 422)
  }

  debug(`started for ${gtin}`)
  const tasks   = []
  const headers = { method: 'head' }
  const rgtin   = realGtin(gtin)
  let imageUrl  = null

  // always search local first
  if (client.length > 0) {
    tasks.push(got(baseUrl + gtinPath(gtin, client) + 'index.jpg', headers))
  }

  // search national
  tasks.push(got(baseUrl + gtinPath(rgtin, '') + 'index.jpg', headers))

  const rsts = await Promise.all(tasks.map(p => p.catch(e => e)))
  rsts.forEach((item) => {
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
