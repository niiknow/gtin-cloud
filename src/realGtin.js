/**
 * Enforce a gtin14 check digit
 *
 * Example: 00123456789010 becomes 00123456789012
 *
 * @param  {string} gtin    the 14 digits Global Trade Item Number
 * @return {string}      actual gtin
 */
export default (gtin) => {
  gtin      = `00000000000000${gtin}`.slice(-14)
  const pfx = gtin.slice(0, 13)

  const checkSum = pfx.split('').reduce((p, v, i) => {
    return i % 2 == 0 ? p + 3 * v : p + 1 * v;
  }, 0)

  // console.log(checkSum)

  return `${pfx}${(10 - checkSum % 10) % 10}`
}
