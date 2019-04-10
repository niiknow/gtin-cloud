import AWS from 'aws-sdk'

const s3    = new AWS.S3()
const debug = require('debug')('gtin-cloud')

export default (path, data, contentType = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Body: data,
      Key: path
    }
    // console.log(path)

    if (contentType) {
      params.ContentType = contentType
    }

    s3.upload(params, (err2, data) => {
        if (err2) {
          debug(`'${path}' upload error`, err2)
          return reject(err2)
        }

        return resolve(data)
      }
    )
  })
}
