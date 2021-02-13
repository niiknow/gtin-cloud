require('./_loadConfig')
import handlers from '../src/primaryVendors'

jest.setTimeout(60000)

describe('itemmaster-research-tests', () => {
  /*test('itemmaster lookup 00688267075230', async () => {
    const rst = await handlers.itemMasterRequest('00688267075230', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('00688267075230')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })*/
  test('syndigo lookup 028400517737', async () => {
    const rst = await handlers.syndigoRequest('028400517737', false)
    console.log(rst)
  })
})
