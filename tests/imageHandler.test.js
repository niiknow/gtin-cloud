import handler from '../src/imageHandler'

const baseUrl = process.env.CDN_BASE

jest.setTimeout(30000)

describe('image-handler-tests', () => {
  test('test request valid gtin with itemmaster', async () => {
    const rst = await handler(
      {
        pathParameters: {
          client: 'itemmaster',
          gtin: '00008100003983'
        },
        queryStringParameters: {
          nocheck: 0
        }
      },
      null,
      (err) => {
        expect(err).toBeNull()
      }
    )

    expect(rst).toBe(baseUrl + 'itemmaster/008/100/003/00008100003983/index.jpg')
  })

  test('test request invalid gtin with kwikee', async () => {
    const rst = await handler(
      {
        pathParameters: {
          client: 'kwikee',
          gtin: '00008100003983'
        },
        queryStringParameters: {
          nocheck: 0
        }
      },
      null,
      (err) => {
        expect(err).toBeNull()
      }
    )

    expect(rst).toBe(baseUrl + '008/100/003/00008100003983/index.jpg')
  })

  // this is commented out because, if it has already been executed
  // then product is no longer new
  /* test('test request queuing of new national product', async () => {
    const rst = await handler(
      {
        pathParameters: {
          gtin: '00725439999687'
        },
        queryStringParameters: {
          nocheck: 0
        }
      },
      null,
      (err) => {
        expect(err).toBeNull()
      }
    )

    expect(rst).toBe(null)
  })*/
})
