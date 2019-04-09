/**
 * Parse gtin into a folder path
 *
 * Example: 00123456789012 becomes 123/456/789/00123456789012
 *
 * @param  {string} gtin the 14 digits Global Trade Item Number
 * @return {string}      the folder path
 */
export default (gtin) => {
  const upc   = gtin2.slice(-12);
  const parts = [upc.substr(0, 3), upc.substr(3, 3), upc.substr(6, 3)];
  return parts.join('/') + '/' + gtin;
}
