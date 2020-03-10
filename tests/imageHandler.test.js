require('./_loadConfig')
import handler from '../src/imageHandler'

const baseUrl = process.env.CDN_BASE

jest.setTimeout(30000)

describe('image-handler-tests', () => {
  test('test request valid gtin with itemmaster', async () => {
    const rst = await handler(
      {
        pathParameters: {
          client: 'itemmaster',
          gtin: '00018200281372'
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

    expect(rst).toBe(baseUrl + '018/200/281/00018200281372/index.jpg')
  })

  test('test request invalid gtin with kwikee', async () => {
    const rst = await handler(
      {
        pathParameters: {
          client: 'kwikee',
          gtin: '00018200281372'
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

    expect(rst).toBe(baseUrl + '018/200/281/00018200281372/index.jpg')
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
