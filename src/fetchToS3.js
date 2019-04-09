import fs from 'fs'
import path from 'path'
import got from 'got'
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_ACCESS_KEY_SECRET,
});

/**
 * Convert date to a number that enable most-recent first sort/ordering
 * on storage system such as AWS S3
 *
 * @param  {string} url the data url
 * @return {string}      the response
 */
export default (url, bucket, path) => {
  const fstream = got.stream(url)

  s3.upload({
        Bucket: bucket,
        Key: path,
        Body: fstream,
    },
    function (err, data) {
        console.log(err, data);
  });
}
