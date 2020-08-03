import crypto     from 'crypto'
import got        from 'got'
import storeTasks from './storeTasks'
import gtinPath   from './gtinPath'

const debug = require('debug')('gtin-cloud')

const digiteyesCreateSignature = (auth_key, ean) => {
  const hash = crypto.createHmac('sha1', auth_key)
  hash.update(ean)
  const sig = hash.digest('base64')
  return sig
}

class Handlers {
  static async digiteyesRequest(gtin, storeData = false, imageUrl = null) {
    try {
      const ak  = process.env.DIGITEYES_APPKEY
      const ean = `0000000000000${gtin}`.slice(-13)
      const sig = digiteyesCreateSignature(process.env.DIGITEYES_AUTHKEY, ean)
      const url = `https://www.digit-eyes.com/gtin/v2_0/?upcCode=${ean}&field_names=all&language=en&app_key=${ak}`
      const fu  = url + sig
      const rst = await got(fu)
      debug(fu)

      const obj     = JSON.parse(rst.body)
      obj.image     = imageUrl || obj.image
      obj.gtin      = gtin
      obj.gtin_path = gtinPath(gtin)
      obj._ts       = (new Date()).toISOString()

      if (storeData) {
        // stash the data and image
        const rsp = storeTasks(gtin, obj.image, 'image', obj, 'digiteyes')
        if (rsp.tasks) {
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return obj
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }
}

export default Handlers
