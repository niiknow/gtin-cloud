import fs from 'fs'
import res from './response'

const debug      = require('debug')('gtin-cloud')

/**
 * Handle form post of type:
 *  application/json
 *  application/x-www-form-urlencoded
 *  multipart/form-data
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  // Parameters
  //  @param  string     gtin    the gtin
  //  @param  string     image_url    the image url
  //  @param  string     data_url     the data url
  //  @param  string     vendor       the vendor (optional - default empty)
  const gtin = event.pathParameters.gtin

}
