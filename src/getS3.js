import AWS      from 'aws-sdk'
import gtinPath from './gtinPath'

const s3 = new AWS.S3()

export default (gtin, vendor = '') => {
  return new Promise((resolve, reject) => {
    const key = gtinPath(gtin, vendor) + 'index.json'

    return s3.getObject({
      Bucket: process.env.AWS_BUCKET,
      Key: key
    }, (err, data) => {
      if (err) {
        return reject(err)
      }

      const body = data.Body.toString('utf-8')
      resolve(JSON.parse(body))
    })
  })
}
