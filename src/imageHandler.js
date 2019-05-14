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
  const client     = (event.pathParameters.client || '').trim().toLowerCase()
  const rspHandler = res(context, callback)
  let gtin         = (event.pathParameters.gtin || '').trim().replace(/[^0-9a-z-]*/gi, '')

  debug(`started for ${gtin}`)

  // no need to validdate, just make it it's 14 chars
  gtin = `00000000000000${gtin}`.slice(-14)

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

  rspHandler(imageUrl, imageUrl ? 302 : 404, imageUrl ? { Location: redir } : null)

  return imageUrl
}
