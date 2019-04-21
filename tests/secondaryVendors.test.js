import handlers from '../src/secondaryVendors'

jest.setTimeout(30000)

describe('digiteyes-research-tests', () => {
  test('digiteyes lookup 00078732004245', async () => {
    const rst = await handlers.digiteyesRequest('00078732004245', false)
    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('00078732004245')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })
})
