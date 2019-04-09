import fs       from 'fs'
import res      from './response'
import saveToS3 from './saveToS3'

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
  //  @param  string     gtin    the gtin
  //  @param  string     image_url    the image url
  //  @param  string     data_url     the data url
  //  @param  string     vendor       the vendor (optional - default empty)
  const gtin       = event.pathParameters.gtin
  const qs         = event.queryStringParameters || {}
  const url        = qs.url
  const type       = qs.type || ''
  const rspHandler = res(context, callback)
  const rawUrl     = url.split(/\#|\?/)[0];
  const fileName   = rawUrl.split('/').pop().trim().toLowerCase();
  const ext        = fileName.split('.').pop().trim();
  const basePath   = gtinPath(gtin, event.pathParameters.vendor);
  let destPath     = basePath + 'index.jpg'

  // possible action values: image or media
  // image is featured image
  if (type.indexOf('image') > -1) {
    // download and store image as index.jpg
    const fstream = got.stream(url)
    await saveToS3(destPath, fstream, 'image/jpeg');
  } else if (type.indexOf('media') > -1) {
    // handle media storage
    fstream  = got.stream(url)
    destPath = basePath + 'media/' + fileName
    await saveToS3(destPath);
  }

  if (event.body) {
    await saveToS3(basePath + 'index.json', event.body, 'application/json');
  }

  return rspHandler(`Uploaed as: ${destPath}`, 422)
}
