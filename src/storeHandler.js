import res      from './response'
import saveToS3 from './saveToS3'
import gtinPath from './gtinPath'
import got      from 'got'

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
  const rawUrl     = url.split(/#|\?/)[0];
  const fileName   = (qs.name || rawUrl.split('/').pop()).trim().toLowerCase();
  const ext        = fileName.split('.').pop();
  const basePath   = gtinPath(gtin, event.pathParameters.vendor);
  const body       = (event.body || '').trim()
  const tasks      = []
  let destPath     = ''

  // validate parameters
  if (type.length > 0 && url.length <= 0) {
    return rspHandler(`url querystring parameter is required for type of ${type}`, 422)
  }

  debug(`begin ${type}: ${url}`)

  // handle image
  if (type.indexOf('image') > -1) {
    if (ext !== 'jpg' || ext !== 'jpeg') {
      return rspHandler(`${fileName} extension must be jpg/jpeg`, 422)
    }

    // download and store image as index.jpg
    destPath = basePath + 'index.jpg'
    const fstream = got.stream(url)
    tasks.push(saveToS3(destPath, fstream, 'image/jpeg'));
  } else if (type.indexOf('media') > -1) {
    // handle media
    destPath = basePath + 'media/' + fileName
    const fstream  = got.stream(url)
    tasks.push(saveToS3(destPath, fstream));
  } else if (type.length > 0) {
    return rspHandler(`Unknown type ${type}`, 422)
  }

  // only store if body is a json
  if (body.indexOf('{') > 0) {
    tasks.push(saveToS3(basePath + 'index.json', event.body, 'application/json'));
  }

  // process all async tasks
  await Promise.all(tasks);

  return rspHandler(`Uploaded as: ${destPath}`, 422)
}
