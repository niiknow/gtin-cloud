import handlers from '../src/primaryVendors'
require('./loadConfig')

jest.setTimeout(30000)

describe('datakick-research-tests', () => {

  test('datakick lookup 00811102020236', async () => {
    const rst = await handlers.datakickRequest('00811102020236', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('00811102020236')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })

})

describe('eandata-research-tests', () => {

  test('eandata lookup 03045320094084', async () => {
    const rst = await handlers.eanDataRequest('03045320094084', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('03045320094084')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })

})

describe('itemmaster-research-tests', () => {
  test('itemmaster lookup 00832544000501', async () => {
    const rst = await handlers.itemMasterRequest('00832544000501', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('00832544000501')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })

})

describe('kwikee-research-tests', () => {

  test('kwikee lookup 00018200281372', async () => {
    const rst = await handlers.kwikeeRequest('00018200281372', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('00018200281372')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })
})

describe('tesco-research-tests', () => {

  test('tesco lookup 05054402919854', async () => {
    const rst = await handlers.tescoRequest('05054402919854', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('05054402919854')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })
})

describe('openfoodfacts-research-tests', () => {

  test('openfoodfacts lookup 03045320094084', async () => {
    const rst = await handlers.tescoRequest('03045320094084', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('03045320094084')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })
})

