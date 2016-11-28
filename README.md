# Azure Table and Blob Storage Migration

These scripts can be used to copy Azure table and blob data from one Azure subscription account 
to another. It leverages streams, so it should be able to handle large volumes of data on a small 
memory footprint.

## Installation

* Check out this code
* Run `npm install `
* Make a copy of `config/default.js` called `config/local.js`
* Edit `config/local.js` with the pairs of source and destination subscription keys
* Run `npm run copy` to copy all the data
* Run `npm run compare` to compare the pairs for equivalent data

## Notes

* Destination blobs and table entities are automatically overwritten
  * A feature to skip already existing data would be a great idea (PRs welcome!) 
* If you're home bandwidth is limited you'll get better performance running this on a temporary VPS
* The code runs sequentially to keep a small footprint
  * Parallelism would be easy to add (PRs welcome!)
