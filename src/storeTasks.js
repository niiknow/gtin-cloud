
import saveToS3 from './saveToS3'
import gtinPath from './gtinPath'
import got      from 'got'

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
  const rawUrl     = url.split(/#|\?/)[0];
  const fileName   = (name || rawUrl.split('/').pop()).trim().toLowerCase();
  const ext        = fileName.split('.').pop()
  const vendor     = (vendor || '').toLowerCase()
  const basePath   = gtinPath(gtin, vendor);
  const body       = (body || '').trim()
  const tasks      = []
  let destPath     = ''

  // handle image
  if (type.indexOf('image') > -1) {
    if (ext !== 'jpg' && ext !== 'jpeg') {
      return { error: `${fileName} extension must be jpg/jpeg` }
    }

    // download and store image as index.jpg
    destPath = basePath + 'index.jpg'
    const fstream = got.stream(url, urlExtra)
    tasks.push(saveToS3(destPath, fstream, 'image/jpeg'));
  } else if (type.indexOf('media') > -1) {
    // handle media
    destPath = basePath + 'media/' + fileName
    const fstream  = got.stream(url, urlExtra)
    tasks.push(saveToS3(destPath, fstream));
  } else if (type.length > 0) {
    return { error: `Unknown type ${type}` }
  }

  // only store if body is a json
  if (body.indexOf('{') > 0) {
    tasks.push(saveToS3(basePath + 'index.json', body, 'application/json'));
  }

  // process all async tasks
  return { tasks: tasks }
}
