import res        from './response'
import realGtin   from './realGtin'
import gtinPath   from './gtinPath'
import got        from 'got'
import isNational from './isNational'
import queueS3    from './queueS3'

const debug       = require('debug')('gtin-cloud')
const baseUrl     = process.env.CDN_BASE
const queuePath   = process.env.QUEUE_PATH
const fallbackUrl = process.env.IM_FALLBACK_URL

/**
 * Handle returning of image url by gtin
 *
 * Also automatically queue national gtin to s3
 * for auto-research
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  const rspHandler = res(context, callback)
  const qs         = event.queryStringParameters || {}
  const client     = (qs.client || '').trim().toLowerCase()
  let gtin         = (event.pathParameters.gtin || '').trim().replace(/[^0-9a-z-]*/gi, '')

  debug(`started for ${gtin}`)

  // no need to validdate, just make it it's 14 chars
  gtin = `00000000000000${gtin}`.slice(-14)

  const tasks   = []
  const headers = { method: 'head' }
  const rgtin   = realGtin(gtin)
  let imageUrl  = null
  let count     = 0
  let hasQueue  = false

  // always search local first
  if (client.length > 0) {
    count++;
    tasks.push(got(baseUrl + gtinPath(gtin, client) + 'index.jpg', headers))
  }

  // if not all number
  if (!/^\d+$/.test(gtin)) {
    count++;
    // search national with the provided gtin
    tasks.push(got(baseUrl + gtinPath(gtin) + 'index.jpg', headers))
  } else if (isNational(gtin)) {
    // research local with real gtin if they do not match
    if (gtin != rgtin) {
      count++;
      tasks.push(got(baseUrl + gtinPath(rgtin, client) + 'index.jpg', headers))
    }

    // search national with real gtin
    count++;
    tasks.push(got(baseUrl + gtinPath(rgtin) + 'index.jpg', headers))

    // check if we already queued the national product research
    if (queuePath) {
      const queueUrl = `https://s3.amazonaws.com/${queuePath}`
      hasQueue = true
      tasks.push(got(`${queueUrl}${rgtin}.jpg`, headers))
    }
  }

  const rsts = await Promise.all(tasks.map(p => p.catch(e => e)))
  rsts.forEach((item, i) => {
    if (imageUrl || i >= count) {
      return
    }

    if (item.statusCode === 200) {
      imageUrl = item.url
    }
  })

  // if queue url results
  if (hasQueue && rsts[count]) {
    // check queue url status code
    if (rsts[count].statusCode !== 200) {
      try {
        await queueS3(queuePath, rgtin)
      } catch(e) {
        // don't care, just debug it
        debug('queue error', e)
      }
    }
  }

  // use fallbackUrl if no imageUrl
  if (!imageUrl && fallbackUrl) {
    imageUrl = fallbackUrl.replace('{gtin}', rgtin)
  }

  rspHandler(imageUrl, imageUrl ? 302 : 404, imageUrl ? { Location: imageUrl } : null)

  return imageUrl
}
