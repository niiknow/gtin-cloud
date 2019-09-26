import AWS      from 'aws-sdk'

const s3 = new AWS.S3()

export default (key) => {
  return new Promise((resolve, reject) => {
    return s3.deleteObject({
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
