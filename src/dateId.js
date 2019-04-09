/**
 * Convert date to a number that enable most-recent first sort/ordering
 * on storage system such as AWS S3
 *
 * @param  {Date} date the date object
 * @return {string}      the response
 */
export default (date) => {
  const today = date.toISOString().slice(0, 16)
  const todayNum = 999999999999 - parseInt(today.replace(/[-T:]+/gi, ''), 10)
  return todayNum.toString()
}
