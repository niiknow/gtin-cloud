# GTIN Cloud
> How would a consumer get all of a GTIN Item Information by simply knowing the GTIN Number of the Item?  And, without using a database?

So, without using a database, we would need to create a convention to store the data in a folder structure that is easy to access and is high performance.

# Storage Stragegy
Let say you have a ficticious GTIN number 00123456789012.  Then the folder path for this GTIN number would be: 123/456/789/00123456789012/

1. Drop the first to 2 digits (00)
2. Split the next 9 numbers into 3 digits folder structure - these are usually Company Prefix (CP)
3. And store image as index.jpg and data as index.json in the GTIN folder/path

# The Power of 3s
- When storing in the cloud like AWS S3, the first 3 characters identify the partition AWS store the data.  This improve the speed of access.
- Storing in 3 characters also prevent a folder from having too many file and folders; assuming that it will all be numeric, it will probably won't be greater than 1000 objects.  Most cloud storage services, including AWS S3, also limit response/list to 1000 objects.  This mean that, if we were to download/sync these files to a local storage, it will also help with local folder listing speed.

# MIT
