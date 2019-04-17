import res        from './response'
import storeTasks from './storeTasks'

const debug = require('debug')('gtin-cloud')

/**
 * Handle storing of gtin featured image, data, and media
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  // Parameters
  //  @param  string     gtin         the gtin
  //  @param  string     image_url    the image url
  //  @param  string     type         image or media
  //  @param  string     vendor       the vendor (optional - default empty)
  const gtin       = `00000000000000${event.pathParameters.gtin}`.slice(-14)
  const qs         = event.queryStringParameters || {}
  const url        = (qs.url || '').trim()
  const type       = (qs.type || '').trim()
  const rspHandler = res(context, callback)

  // validate parameters
  if (type.length > 0 && url.length <= 0) {
    return rspHandler(`URL querystring parameter is required for type of ${type}`, 422)
  }

  debug(`begin ${type}: ${url}`)
  const rsp = storeTasks(gtin, url, type, event.body, qs.vendor, qs.name)

  if (rsp.error) {
    return rspHandler(rsp.error, 422)
  }

  await Promise.all(rsp.tasks)

  rspHandler(`Uploaded as: ${rsp.destPath}`)
}
