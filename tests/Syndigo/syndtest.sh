#!/bin/bash
# EXECUTE POST
# ./synctest.sh username secret 'apibody' "https://api.syndigo.com/api/marketplace/search?skip=0&take=25&companyId=DATAOWNERID"
# ./synctest.sh username secret 'apibody' "https://api.syndigo.com/api/search/productsearch/scroll?take=25"
# EXECUTE GET
# ./synctest.sh username secret '' "https://api.syndigo.com/api/search/productsearch/scroll?take=25"
#

CURL=$(whereis curl)
USERNAME=$1
SECRET=$2
APIBODY=$3
APIURL=$4
OUTFILE="syndtest.json"

set -x

function getAuth {
  $CURL -s -G --data-urlencode "username=$USERNAME" --data-urlencode "secret=$SECRET" 'https://api.syndigo.com/api/auth'
}

AUTHRESULT=$(getAuth)
ECHO "AUTH RESULT: $AUTHRESULT"


RUNONE=$(echo "$AUTHRESULT" | sed "s/{\"Value\":\"//g")
AUTHVALUE=$(echo "$RUNONE" | sed "s/\"}//g")

rm -f $OUTFILE
if [[ -z "$APIBODY" ]]; then
  $CURL -G --header "Content-Type: application/json" --header "Authorization: EN $AUTHVALUE" -d "$APIBODY" "$APIURL" -o "$OUTFILE"
else

  $CURL -X POST --header "Content-Type: application/json" --header "Authorization: EN $AUTHVALUE" -d "$APIBODY"  "$APIURL" -o "$OUTFILE"
fi

COUNTER=1
while [ ! -f "$OUTFILE" ]; do
  COUNTER=$((COUNTER + 1))
  echo "$COUNTER waiting..."
  sleep 1
done

cat "$OUTFILE"
