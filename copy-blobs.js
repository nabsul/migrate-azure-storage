const _ = require( 'lodash' );
const BlobClient = require( './lib/blob-client' );

const copyBlobs = ( source, destination ) => {
	const sourceClient = new BlobClient( source );
	const destinationClient = new BlobClient( destination );

	const copyBlob = ( container, name ) => {
		let retries = 3;
		const readStreamTask = sourceClient.getReadStreamAsync( container, name );
		const writeStreamTask = destinationClient.getWriteStreamAsync( container, name );
		return Promise.all( [ readStreamTask, writeStreamTask ] )
			.then( _.spread( ( readStream, writeStream ) => {
				readStream.pipe( writeStream );
				return new Promise( ( resolve, reject ) => {
					let returned = false;
					readStream.on( 'error', ( error ) => {
						if ( returned ) {
							return;
						}
						returned = true;
						reject( error );
					} );

					writeStream.on( 'error', ( error ) => {
						if ( returned ) {
							return;
						}
						returned = true;
						reject( error );
					} );

					readStream.on( 'end', resolve );
				} );
			} ) )
			.then( () => {
				console.log( `Copied blob: ${name}` );
			} )
			.catch( ( error ) => {
				if ( 0 >= retries-- ) {
					throw error;
				}

				console.log( 'Failed, retrying...' );
				return copyBlob( container, name );
			} );
	};

	const processContainer = ( container, token ) => {
		if ( !token ) {
			console.log( `Processing container: ${container}` );
		} else {
			console.log( `Continuing container: ${container}` );
		}

		return destinationClient.createContainerIfNotExistsAsync( container )
			.then( () => {
				return sourceClient.listBlobsAsync( container, token );
			} )
			.then( ( result ) => {
				const reducer = ( task, entry ) => task.then( () => copyBlob( container, entry.name ) );
				return _.reduce( result.entries, reducer, Promise.resolve() )
					.then( () => result );
			} )
			.then( ( result ) => {
				console.log( `Processed ${container}: ${result.entries.length} blobs` );
				if ( !result.continuationToken ) {
					console.log( 'complete' );
					return;
				}

				return processContainer( container, result.continuationToken );
			} );
	};

	const fetchContainers = ( token ) => {
		return sourceClient.listContainersAsync( token )
			.then( ( result ) => {
				const reducer = ( task, entry ) => task.then( () => processContainer( entry.name ) );
				return _.reduce( result.entries, reducer, Promise.resolve() )
					.then( () => result );
			} )
			.then( ( result ) => {
				console.log( `Processed ${result.entries.length} containers` );
				if ( !result.continuationToken ) {
					return;
				}

				console.log( 'Fetching more containers' );
				return fetchContainers( result.continuationToken );
			} );
	};

	return fetchContainers();
};

module.exports = copyBlobs;
