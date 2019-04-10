# GTIN Cloud
> Without using a database, how would you store and access Item informations by simply providing its GTIN Number?  And, without using a database?

Without using a database, we would need to create a convention to store the data in folder structures that are easy to access without sacraficing performance.

# Storage Stragegy
Let say you have a ficticious GTIN number 00123456789012.  Then the folder path for this GTIN number would be: 123/456/789/00123456789012/

1. Drop the first to 2 digits (00) - these are usually package and country identifier
2. Split the next 9 numbers into 3 digits folder structure - these are usually Company Prefix (CP) identifier digits
3. And store image as index.jpg and data as index.json in the GTIN folder/path

# The Power of 3s
- When storing in the cloud like AWS S3, the first 3 characters identify the partition AWS store the data.  This improve the speed of access.
- Storing in 3 characters also prevent a folder from having too many file and folders; assuming that it will all be numeric, will probably result in less than 1000 objects per folder.  Most cloud storage services, including AWS S3, also limit response/list to 1000 objects.  Also, if we were to download/sync these files to a local storage, it will help with folder listing speed.

# Security
Does this kind of convention create a security issue?  What if I want my data to be private?

Security is by adding an API key to the service and disabling public access to the cloud bucket.  Obscurity is not Security!

# TIP
A Content Delivery Network (CDN) would go a long way to help increase the performance of Cloud Storage access.

# Research API Integration
- [x] EAN Data - https://eandata.com/feed/?v=3&find=ean13&keycode=apikey&mode=json
- [x] Item Master - https://api.itemmaster.com/v2.2/item/?upc=gtin&ef=jpg&eip=75&epf=1000&allImg=Y
- [x] Kwikee - https://api.kwikee.com/public/v3/data/gtin/%s
- [ ] Search UPC - http://www.searchupc.com/handlers/upcsearch.ashx?request_type=3&upc=%s&access_token=%s
- [ ] UPC ItemDB - https://api.upcitemdb.com/prod/trial/lookup?upc=%s
- [ ] Barcodeable - https://www.barcodable.com/api/v1/%s/%s
- [ ] Walmart - https://api.walmartlabs.com/v1/items?apiKey=%s&upc=%s
- [ ] Tesco - https://dev.tescolabs.com/product/?gtin=%s

# MIT
