import handlers from '../src/websiteVendors.js'

jest.setTimeout(30000)

describe('scrape-google', () => {
  test('scrape-google invalid 00819898012009', async () => {
    const rst = await handlers.googleshoppingRequest('00819898012009', false)

    // console.log(rst)
    expect(rst).toBe('00819898012009 not found')
  })

  test('scrape-google 00602652171840', async () => {
    const rst = await handlers.googleshoppingRequest('00602652171840', false)

    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.gtin).toBe('00602652171840')
    expect(rst.image).not.toBeNull()
    expect(rst.image.length > 0).toBe(true)
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })
})
