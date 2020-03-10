require('./_loadConfig')
import handlers from '../src/websiteVendors.js'

jest.setTimeout(30000)

describe('scrape-google', () => {
  test('scrape-google invalid xx819898012009', async () => {
    const rst = await handlers.googleshoppingRequest('xx819898012009', false)

    // console.log(rst)
    expect(rst.indexOf('xx819898012009 not found')).toBe(0)
  })

  test('scrape-google 00602652171840', async () => {
    const rst = await handlers.googleshoppingRequest('00602652171840', false)

    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst.image).not.toBeNull()
    expect(rst.gtin).toBe('00602652171840')
    expect(rst.gtin_path).not.toBeNull()
    expect(rst._ts).not.toBeNull()
  })
})
