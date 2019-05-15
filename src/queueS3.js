import AWS from 'aws-sdk'

const s3    = new AWS.S3()
const debug = require('debug')('gtin-cloud')

export default (queuePath, gtin, contentType = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    const parts  = queuePath.split('/')
    const bucket = parts[0]
    const rest   = queuePath.substr(bucket.length).replace(/^\/+|\/+$/g, '')

    const params = {
      Bucket: bucket,
      Body: ' ',
      Key: `${rest}/${gtin}.jpg`
    }
    // console.log(path)

    if (contentType) {
      params.ContentType = contentType
    }

    debug(`queuing research ${bucket}/${params.Key}`)

    s3.upload(params, (err2, data) => {
        if (err2) {
          debug(`'${params.Key}' upload error`, err2)
          return reject(err2)
        }

        return resolve(data)
      }
    )
  })
}
