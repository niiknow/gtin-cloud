import got from 'got'
import saveToS3 from '../src/saveToS3.js'

jest.setTimeout(30000)

describe('save-to-s3-tests', () => {
  test('saveToS3 404', async () => {
    const fstream = got.stream('https://img.tesco.com/Groceries/pi/404/404/IDShot_540x540.jpg')
    try {
      await saveToS3('test/404.jpg', fstream, 'image/jpeg')
      expect(true).toBe(false);
    } catch(e) {
      expect(e).not.toBeNull()
      expect(e.statusCode).toBe(404)
    }
  })

  test('got 404', async () => {
    try {
      await got('https://img.tesco.com/Groceries/pi/404/404/IDShot_540x540.jpg', { method: 'head' })
      expect(true).toBe(false);
    } catch(e) {
      expect(e).not.toBeNull()
      expect(e.statusCode).toBe(404)
    }
  })
})

