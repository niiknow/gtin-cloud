const rspHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export default (rsp, callback) => {
  return (data, code=200, headers=null) => {
    const body = JSON.stringify({ status: code, message: data })
    if (callback) {
      const rst = {
        headers: headers || rspHeaders,
        statusCode: code,
        body: body
      }

      return callback(null, rst)
    }

    rsp.writeHead(code, headers || rspHeaders)
    rsp.write(body)
    rsp.end()
  }
}
