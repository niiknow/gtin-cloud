/**
 * Parse gtin into a folder path
 *
 * Example: 00123456789012 becomes 123/456/789/00123456789012
 *
 * @param  {string} gtin    the 14 digits Global Trade Item Number
 * @param  {string} vendor  the vendor
 * @return {string}      the folder path
 */
export default (gtin, vendor = '') => {
  const upc   = gtin.slice(-12)
  const parts = [upc.substr(0, 3), upc.substr(3, 3), upc.substr(6, 3)]
  let myPath  = parts.join('/') + '/' + gtin + '/'
  vendor      = (vendor || '').trim()

  if (vendor.length > 0) {
    myPath = `${vendor}/${myPath}`
  }

  return myPath
}
