# Azure Table and Blob Storage Migration

These scripts can be used to copy Azure table and blob data from one Azure subscription account 
to another. It leverages streams, so it should be able to handle large volumes of data on a small 
memory footprint.

## Installation

* Check out this code
* Run `npm install `
* Make a copy of `config/default.js` called `config/local.js`
* Edit `config/local.js` with the pairs of source and destination connection strings
* Run `npm run copy` to copy all the data
* Run `npm run compare` to compare the pairs for equivalent data

## Notes

* Destination blobs and table entities are automatically overwritten
  * A feature to skip already existing data would be a great idea (PRs welcome!) 
* If you're home bandwidth is limited you'll get better performance running this on a temporary VPS
* The code runs sequentially to keep a small footprint
  * Parallelism would be easy to add (PRs welcome!)

## Copying Data

### Blob Storage

The algorithm for copying all the blobs is as follows:

* List all containers in the source storage account
* For each container:
  * Create a container with the same name if it does not exist
  * For each blob in the source container
    * Create a blob with the same name and content type metadata in the destination container
    * Stream the contents from source to destination blobs
    
### Table Storage

The algorithm for the copying table data is as follows:

* List all tables in the source storage account
* For each table:
  * Create a table in the destination account with the same name if it does not exist
  * Query for all entries and for each batch of entities:
    * Group by PartitionKey and batches of up to 90 entities
    * Insert entities of each batch with one operation 
    
## Comparing Data
 
### Blob Storage

* Check that the same set of containers exist in both accounts
* For each container name, query for all blobs and compare:
  * Blob name
  * Blob size
  * Content type header
  * Content MD5

### Table Storage

* Check that the same set of table names exist in both accounts
* For each table name, query for all entities and compare contents
* The following fields in the entities are ignored in the comparison:
  * Timestamp
  * .metadata ( etag )
