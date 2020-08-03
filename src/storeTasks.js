import saveToS3 from './saveToS3'
import gtinPath from './gtinPath'
import got      from 'got'

const debug = require('debug')('gtin-cloud')

/**
 * Parse gtin into a folder path
 *
 * Example: 00123456789012 becomes 123/456/789/00123456789012
 *
 * @param  {string} gtin    the 14 digits Global Trade Item Number
 * @param  {string} vendor  the vendor
 * @return {string}      the folder path
 */
export default (gtin, url, type, body, vendor = '', name = null, urlExtra = null) => {
  vendor = (vendor || '').toLowerCase()

  const rawUrl   = (url || '').trim().split(/#|\?/)[0];
  const basePath = gtinPath(gtin, vendor);
  const tasks    = []
  let destPath   = ''

  // handle image
  if (rawUrl.indexOf('http') === 0) {
    const fileName = (name || rawUrl.split('/').pop()).toLowerCase();
    // const ext      = fileName.split('.').pop()

    if (type.indexOf('image') > -1) {
      // itemmaster start responding without extension
      /*if (ext !== 'jpg' && ext !== 'jpeg') {
        return { tasks: [], error: `${fileName} extension must be jpg/jpeg`, destPath: destPath }
      }*/

      // download and store image as index.jpg
      destPath = basePath + 'index.jpg'
      const fstream = got.stream(url, urlExtra)
      tasks.push(saveToS3(destPath, fstream, 'image/jpeg'));
    } else if (type.indexOf('media') > -1) {
      // handle media
      destPath = `${basePath}media/${fileName}`
      const fstream  = got.stream(url, urlExtra)
      tasks.push(saveToS3(destPath, fstream));
    } else if (type.length > 0) {
      debug(`storeTasks: unknown type ${type}`)
      return { tasks: [], error: `Unknown type ${type}`, destPath: destPath }
    }
  }

  // only store if body is a json
  if (body && typeof body !== 'string') {
    // save vendor
    body.vendor = vendor
    tasks.push(saveToS3(basePath + 'index.json', JSON.stringify(body), 'application/json'));
  }

  // process all async tasks
  return { tasks: tasks, destPath: destPath }
}
