import realGtin from '../src/realGtin'

jest.setTimeout(30000)

describe('real-gtin-tests', () => {
  test('gtin correctly create check digit for 00123456789010', async () => {
    const rst = realGtin('00123456789010')

    // console.log(rst)
    expect(rst).not.toBeNull()
    expect(rst).toBe('00123456789012')
  })
})
