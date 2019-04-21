# GTIN Cloud
> Without using a database, how would you store and access Item informations by simply providing its GTIN Number?

We would need to create a convention to store the data in folder structures that are easy to access, without sacrificing performance.

# Storage Stragegy
Let say you have a ficticious GTIN number 00123456789012.  Then the folder path for this GTIN number would be: 123/456/789/00123456789012/

1. Drop the first to 2 digits (00) - these are usually package and country identifier
2. Split the next 9 numbers into 3 digits folder structure - these are usually the Company Prefix (CP)
3. And store image as index.jpg and data as index.json in the GTIN folder/path: 123/456/789/00123456789012/index.jpg & 123/456/789/00123456789012/index.json

# The Power of 3s
- We know that, when storing in the cloud like AWS S3, the first 3 characters identify the partition it use to store the data.  This improve the speed of access.
- Storing in 3 characters also prevent a folder from having too many file and folders; assuming that it will all be numeric, will result in less than 1000 objects per folder.  Most cloud storage services, including AWS S3, also limit response/listing to 1000 objects.  Also, if we were to download/sync these files to a local storage, it will help with folder listing speed.

# Security
Does this kind of convention create a security issue?  What if I want my data to be private?

Security can be achieved by adding an API Key to the service, and disabling public access to the cloud bucket.  Obscurity is not Security!

# TIP
A Content Delivery Network (CDN) would go a long way to help increase the performance of Cloud Storage access.  AWS also provide CDN through their Cloudfront service.

# Research API Integrations
**Primary** - APIs with basically limitless calls
- [x] Item Master - https://api.itemmaster.com/v2.2/item/?upc=gtin&ef=jpg&eip=75&epf=1000&allImg=Y
- [x] Kwikee - https://api.kwikee.com/public/v3/data/gtin/%s
- [x] Tesco - https://dev.tescolabs.com/product/?gtin=%s
- [x] DataKick - https://www.datakick.org/api/items/%s
- [x] EAN Data - https://eandata.com/feed/?v=3&find=ean13&keycode=apikey&mode=json
- [x] Open Food Facts - https://world.openfoodfacts.org/api/v0/product/%s.json

**Secondary** - APIs with low daily/monthly limit
- [ ] Search UPC - http://www.searchupc.com/handlers/upcsearch.ashx?request_type=3&upc=%s&access_token=%s
- [ ] UPC ItemDB - https://api.upcitemdb.com/prod/trial/lookup?upc=%s
- [ ] Barcodeable - https://www.barcodable.com/api/v1/%s/%s
- [ ] Walmart - https://api.walmartlabs.com/v1/items?apiKey=%s&upc=%s

> Research API introduce pulling data from various vendors, example: datakick, eandata, itemmaster, kwikee

We segment the Vendor's storage path to help with data retrieval and/or purge if requested by the Vendor.

# API
### POST|GET /store/{gtin}?type=image&vendor=vendor&url=https://the.urlencoded.com/image.jpg
POST or GET to store the GTIN data on AWS S3.  POST body will become `index.json` and `url` query string parameter is downloaded as `index.jpg`

The optional `vendor` parameter identify that this is to store Vendor's specific data.  `type` can be media to store the additional media (image/video) in the `media/` folder. 

### GET /research/{vendor}?q=gtin&force=0&nostore=0&url=imageUrl
1. *vendor* - the vendor to perform research
2. *force* - default is 0; research result will usually return from cache; set this to 1 to force it not to use cache
3. *nostore* - default is 0; set to 1 to not cache the research result
4. *q* - the gtin
5. *url* - optional: if you have the image URL already, pass it in to use instead of trying to perform additional research/API calls.  Sometime, Vendor API requires multiple call to get both image and gtin.  This help reduce the research API calls; so to not exceed Vendor's API rate limit.

# TODO
- [ ] More research API integration coming soon...
- [ ] Find even more API.  Please open an issue and make some suggestion if you know any?

# MIT
See [LICENSE](LICENSE) file.
