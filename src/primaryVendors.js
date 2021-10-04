import got        from 'got'
import xmljs      from 'xml-js'
import storeTasks from './storeTasks'
import gtinPath   from './gtinPath'

const debug = require('debug')('gtin-cloud')

let syndigoAuthValue = ''

class Handlers {
  static async eanDataRequest(gtin, storeData = false, imageUrl = null) {
    const searchParams = {
      v: 3,
      find: `0000000000000${gtin}`.slice(-13),
      keycode: process.env.EANDATA_KEY,
      mode: 'json'
    }

    try {
      const rst = await got('https://eandata.com/feed/', { searchParams })
      // debug(rst.body)

      const obj   = JSON.parse(rst.body)
      let product = null

      if (!obj.product) {
        return { error: 'request error', response: rst.body }
      }
      product           = obj.product
      product.gtin      = gtin
      product.gtin_path = gtinPath(gtin)
      product._ts       = (new Date()).toISOString()

      if (product.attributes.product !== 'Unknown') {
        debug(`found ${gtin}`)
        product.image = imageUrl || product.image

        // console.log(obj)
        // debug(itemJson)
        if (storeData) {
          // stash the data and image
          const rsp = storeTasks(gtin, product.image, 'image', product, 'eandata')
          debug('prep to store data', rsp.tasks.length)
          if (rsp.tasks.length > 0) {
            debug('storing data')
            await Promise.all(rsp.tasks)
          }
        }

      }

      debug(`completed ${gtin}`)
      return product || `${gtin} not found`
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static syndigoExtractAsset(components, attrId) {
    if (Array.isArray(components)) {
      let i = 0;
      for (i=0; i < components.length; i++) {
        let comp = components[i]
        if (comp.Assets && comp.Assets['en-US']) {
          let j = 0
          for (j=0; j < comp.Assets['en-US'].length; j++) {
            let asset = comp.Assets['en-US'][j]
            if (asset.AttributeId === attrId) {
              // immediately return if found
              return asset
            }
          }
        }
      }
    }

    return null
  }

  static syndigoExtractMainImage(components) {
    let image = null

    if (Array.isArray(components)) {
      // Front-Center-Elevated
      let asset = Handlers.syndigoExtractAsset(components, 'e3238a4c-1936-400d-84c0-63cb320c24ce')
      if (asset) {
        image = `https://assets.edgenet.com/${asset.Value}?filetype=jpg&size=1000&numratio=1&denratio=1&crop=False`
      } else {
        // Planogram Front
        asset = Handlers.syndigoExtractAsset(components, 'e730a004-f954-4b6f-86cf-13f03864ddf2')
        if (asset) {
          image = `https://assets.edgenet.com/${asset.Value}?filetype=jpg&size=1000&numratio=1&denratio=1&crop=False`
        } else {
          // Main Product Image
          asset = Handlers.syndigoExtractAsset(components, '645296e8-a910-43c3-803c-b51d3f1d4a89')
          if (asset) {
            image = `https://assets.edgenet.com/${asset.Value}?filetype=jpg&size=1000&numratio=1&denratio=1&crop=False`
          }
        }
      }
    }

    return image
  }

  static async syndigoRequest(gtin, storeData = false, imageUrl = null) {
    const baseUrl  = process.env.SYNDIGO_URL
    const userName = encodeURIComponent(process.env.SYNDIGO_USERNAME)
    const secret   = encodeURIComponent(process.env.SYNDIGO_SECRET)
    const ownerId  = process.env.SYNDIGO_DATAOWNERID

    if (!syndigoAuthValue) {
      // auth
      const authResult = await got(`${baseUrl}/api/auth?username=${userName}&secret=${secret}`, { responseType: 'json' })
      // get Value
      syndigoAuthValue = authResult.body.Value
    }

    const url = `${baseUrl}/ui/product/`
    const headers = {
      'Authorization': `EN ${syndigoAuthValue}`
    }
    const json = {
      'OrderBy': '26834672-7c90-4918-9b19-5bd419023b12',  // sort by DatePosted DESC
      'Desc': true,
      'SearchStringAttributes':[
        '0994d0f8-35e7-4a6d-9cd9-2ae97cd8b993'
      ],
      'AttributeFilterOperator': 'Or',
      'Archived': false,
      'OnHold': false,
      'SearchString': gtin,
      'DataOwner': ownerId
    }
    const searchParams = {
      skip: 0,
      take: 1
    }
    let myGtin  = `0000000000000${gtin}`.slice(-14)
    let product = {}
    let image   = imageUrl
    // console.log(headers.Authorization)

    try {
      const rst = await got.post(url, { json, headers, searchParams, responseType: 'json' })

      product = rst.body.Results[0]

      if (product) {
        product.gtin      = myGtin
        product.image     = image
        product.gtin_path = gtinPath(myGtin)
        product._ts       = (new Date()).toISOString()

        if (product.Components && product.image == null) {
          product.image = Handlers.syndigoExtractMainImage(product.Components)
        }

        if (storeData) {
          // stash the data and image
          const rsp = storeTasks(myGtin, product.image, 'image', product, 'syndigo', null, { headers })
          debug('prep to store data', rsp.tasks.length)
          if (rsp.tasks.length > 0) {
            debug('storing data', rsp.tasks.length)
            await Promise.all(rsp.tasks)
          }
        }
      } else {
        debug('Product not found', rst.body)
      }

      return product
    } catch(e) {
      syndigoAuthValue = ''
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error', ex: e }
    }
  }

  static async itemMasterRequest(gtin, storeData = false, imageUrl = null, manufacturer = null) {
    const url = `${process.env.SYNDIGO_URL}/im/v2.2/item/`

    const headers = {
      username: process.env.IM_USER,
      password: process.env.IM_PASS
    }

    const searchParams = {
      upc: gtin,
      ef: 'jpg',
      idx: 0,
      limit: 1,
      epf: 1000,
      pi: 'c',
      allImg: 'Y'
    }

    let myGtin = `0000000000000${gtin}`.slice(-14)

    if (manufacturer) {
      searchParams.m = manufacturer
    }

    try {
      debug(`begin ${gtin} store ${storeData}`, searchParams, imageUrl)
      const rst  = await got(url, { searchParams, headers })
      const json = xmljs.xml2json(rst.body, {
        compact: true,
        ignoreDeclaration: true
      })

      const obj     = JSON.parse(json)
      let product   = null
      let image     = imageUrl

      if (obj.items && obj.items.item) {
        // console.log(JSON.stringify(obj.items.item, null, 2))
        product = obj.items.item

        if (image === null && product.media) {
          const medias = product.media.medium || product.media

          if (Array.isArray(medias)) {
            medias.forEach((media) => {
              if (image) {
                return;
              }

              // console.log(media)
              if (media._attributes.view === 'E_A1A3_1000x1000') {
                image = media.url._text
              }
            })
          } else if (medias.url) {
            image = medias.url._text
          }
        }

        if (image) {
          image = image.replace('trim=True', '').replace('transparent=True', '')
        }


        product.gtin      = myGtin
        product.image     = image
        product.gtin_path = gtinPath(myGtin)
        product._ts       = (new Date()).toISOString()

        if (storeData) {
          // stash the data and image
          const rsp = storeTasks(myGtin, image, 'image', product, 'itemmaster', null, { headers })
          debug('prep to store data', rsp.tasks.length)
          if (rsp.tasks.length > 0) {
            debug('storing data')
            await Promise.all(rsp.tasks)
          }
        }
      } else {
        debug(json)
        return `${gtin} not found`
      }

      debug(`completed ${gtin}`)
      return product ? product : `${gtin} empty result`
    } catch(e) {
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async kwikeeRequest(gtin, storeData = false, imageUrl = null) {

    gtin = `0000000000000${gtin}`.slice(-14)

    const url  = `https://api.kwikee.com/public/v3/data/gtin/${gtin}`
    const iurl = `https://api.kwikee.com/public/v3/images/ecom/gtin/${gtin}`
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.KWIKEE_KEY
    }

    try {
      const r1      = got(url, { headers })
      const r2      = got(iurl, { headers })
      const rsts    = await Promise.all([r1, r2])
      const obj     = JSON.parse(rsts[0].body)
      const idata   = JSON.parse(rsts[1].body)
      obj.gtin      = gtin
      obj.media     = idata
      obj.gtin_path = gtinPath(gtin)
      obj._ts       = (new Date()).toISOString()
      let image     = imageUrl

      if (image === null && idata.kwikeeApiV3 && idata.kwikeeApiV3.gtin)
      {
        obj.media = idata.kwikeeApiV3.gtin[0] || idata.kwikeeApiV3.gtin
        if (obj.media.mainImageAsset) {
          let i = 0;
          for (i=0; i < obj.media.mainImageAsset.files.length; i++) {
            let img = obj.media.mainImageAsset.files[i];
            if (img.mimetype.toLowerCase() === 'image/jpeg'
              && img.type.toLowerCase() === 'kwikee:gs1') {
              image = img.url
              break;
            }
          }
        }
      }

      obj.image = image

      if (storeData) {
        // console.log(image)
        const rsp = storeTasks(gtin, image, 'image', obj, 'kwikee', `${gtin}.jpg`, { headers })
        debug('prep to store data', rsp.tasks.length)
        if (rsp.tasks.length > 0) {
          debug('storing data')
          await Promise.all(rsp.tasks)
        }
      }

      debug(`completed ${gtin}`)
      return obj
    } catch(e) {
      // console.log(e)
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async tescoRequest(gtin, storeData = false, imageUrl = null) {

    gtin = `0000000000000${gtin}`.slice(-14)

    const ean  = gtin.slice(-13)
    const url  = `https://dev.tescolabs.com/product/?gtin=${gtin}`
    const iurl = imageUrl || `https://img.tesco.com/Groceries/pi/${ean.slice(-3)}/${ean}/IDShot_540x540.jpg`
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.TESCO_KEY
    }

    try {
      // get product data
      // check if image exists by EAN pattern
      const r1   = got(url, { headers })
      const r2   = got(iurl, { method: 'head' })
      const rsts = await Promise.all([r1, r2])
      const obj  = JSON.parse(rsts[0].body).products[0]

      if (obj) {
        obj.gtin      = gtin
        obj.gtin_path = gtinPath(gtin)
        obj._ts       = (new Date()).toISOString()

        if (rsts[1].statusCode !== 404) {
          obj.image = iurl
        }

        if (storeData) {
          // console.log(image)
          const rsp = storeTasks(gtin, obj.image, 'image', obj, 'tesco', `${gtin}.jpg`)
          debug('prep to store data', rsp.tasks.length)
          if (rsp.tasks.length > 0) {
            debug('storing data')
            await Promise.all(rsp.tasks)
          }
        }
      } else {
        return `${gtin} not found`
      }

      debug(`completed ${gtin}`)
      return obj
    } catch(e) {
      // console.log(e)
      debug(JSON.stringify(e, null, 2))
      return { error: 'request error' }
    }
  }

  static async openfoodfactsRequest(gtin, storeData = false, imageUrl = null) {
    try {
      const rst = await got(`https://world.openfoodfacts.org/api/v0/product/${gtin}.json`)
      // debug(rst.body)

      const obj = JSON.parse(rst.body).product

      if (!obj) {
        return `${gtin} not found`
      }

      obj.gtin      = gtin
      obj.gtin_path = gtinPath(gtin)
      obj._ts       = (new Date()).toISOString()
      obj.image     = imageUrl || obj.image_url

      // console.log(obj)
      // debug(itemJson)
      if (storeData) {
        // stash the data and image
        const rsp = storeTasks(gtin, obj.image, 'image', obj, 'openfoodfacts')
        debug('prep to store data', rsp.tasks.length)
        if (!rsp.error && rsp.tasks.length > 0) {
          debug('storing data')
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
