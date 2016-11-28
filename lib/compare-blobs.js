const _ = require( 'lodash' );
const Client = require( './blob-client' );

const getAllContainers = ( client, token ) => {
	const containers = [];
	return client.listContainersAsync( token )
		.then( ( result ) => {
			result.entries.forEach( ( entry ) => containers.push( entry.name ) );
			if ( result.continuationToken ) {
				return getAllContainers( client, result.continuationToken );
			}
		} )
		.then( ( result ) => {
			if ( result ) {
				result.entries.forEach( ( entry ) => containers.push( entry.name ) );
			}

			return containers;
		} );
};

const getCompareValue = ( blob ) => ( {
	name: blob.name,
	length: blob.contentLength,
	type: blob.contentSettings.contentType,
	md5: blob.contentSettings.contentMD5,
} );

const checkPair = ( a, b ) => {
	const aValues = getCompareValue( a );
	const bValues = getCompareValue( b );
	return _.isEqual( aValues, bValues );
};

const feedBlobs = ( client, container, queue, check, token ) => {
	return client.listBlobsAsync( container, token )
		.then( ( result ) => {
			result.entries.forEach( e => queue[ e.name ] = e );
			check();
			if ( result.continuationToken ) {
				return feedBlobs( client, container, queue, check, result.continuationToken );
			}
		} );
};

const compareContainers = ( sourceClient, destinationClient, container ) => {
	console.log( `Checking blob container: ${container}` );
	const sourceBlobs = {};
	const destinationBlobs = {};
	let counter = 0;

	const checkBlobs = () => {
		const commonKeys = _.intersection( _.keys( sourceBlobs ), _.keys( destinationBlobs ) );
		const allSuccess = _.every( commonKeys, ( key ) => {
			const blobA = sourceBlobs[ key ];
			const blobB = destinationBlobs[ key ];
			if ( ! checkPair( blobA, blobB ) ) {
				console.dir( blobA );
				console.dir( blobB );
				return false;
			}

			delete sourceBlobs[ key ];
			delete destinationBlobs[ key ];
			counter++;
			return true;
		} );

		if ( ! allSuccess ) {
			throw new Error( 'Blob content mismatch' );
		}
	};

	const feedTasks = [
		feedBlobs( sourceClient, container, sourceBlobs, checkBlobs ),
		feedBlobs( destinationClient, container, destinationBlobs, checkBlobs ),
	];

	return Promise.all( feedTasks )
		.then( () => {
			if ( 0 < _.keys( sourceBlobs ).length || 0 < _.keys( destinationBlobs ).length ) {
				console.dir( sourceBlobs );
				console.dir( destinationBlobs );
				throw new Error( 'Mismatch in container blobs' );
			}

			console.log( `Identical blobs: ${counter}` );
		} );
};

const compareBlobs = ( source, destination ) => {
	const sourceClient = new Client( source );
	const destinationClient = new Client( destination );

	return Promise.all( [ getAllContainers( sourceClient ), getAllContainers( destinationClient ) ] )
		.then( _.spread( ( src, dst ) => {
			if ( ! _.isEqual( src, dst ) ) {
				throw new Error( 'Blob container list does not match' );
			}

			console.log( 'Container names are identical' );
			const reducer = ( task, container ) => task.then( () => compareContainers( sourceClient, destinationClient, container ) );
			return _.reduce( src, reducer, Promise.resolve() );
		} ) );
};

module.exports = compareBlobs;
