/**
 * determine if national product
 *
 * @param  {string} gtin    the 14 digits Global Trade Item Number
 * @return {boolean}      true if national product
 */
export default (gtin) => {
  if (!/^\d+$/.test(gtin)) {
    return false
  }

  // digit 1 is packaging level, digit 2 determine country so we ignore
  const upc12 = `00000000000000${gtin}`.slice(-12)
  const num   = Number(upc12)

  if (isNaN(num) || num === Infinity) {
    return false
  }

  /* For upc12 or upca
    0, 1, 6, 7 or 8 indicates a manufactured product that is not a drug.
    2 indicates a material destined for local usage for example in a store
        or a warehouse. The manufacturer code section of the barcode is used
        for item number and the product code part is used for weight or the
        price. The first digit of the product code section determines if
        that section is used for price or weight.
    3 indicates a drug. The code is referred to as the National Drug Code
        or more commonly, the UPN code.
    4 is used to indicate a non-food item such as a loyalty card.
    5 or 9 are used to indicate a manufacturer coupon or discount.
        In this case manufacturer code remains unchanged whereas the product
        codes first 3 digits are used as family code and the other 2 digits
        are the coupon code which also determines the discount amount.
  */
  if (num < 1000000) {
      return false
  } else if (upc12) {
      // exit if upc code is a personal code
      const upcode = upc12.charAt(0)
      if (upcode === '2' || upcode === '4' || upcode === '5' || upcode === '9') {
          return false
      }
  }

  // finally
  return true
}
