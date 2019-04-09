import fs       from 'fs'
import res      from './response'
import saveToS3 from './saveToS3'

const debug = require('debug')('gtin-cloud')


/**
 * Proxy request to external vendor for GTIN data
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
}
