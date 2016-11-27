const _ = require( 'lodash' );
const Client = require( './lib/blob-client' );

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
	//type: blob.contentSettings.contentType,
	md5: blob.contentSettings.contentMD5,
} );

const checkPair = ( a, b ) => {
	aValues = getCompareValue( a );
	bValues = getCompareValue( b );
	if ( ! _.isEqual( aValues, bValues  ) ) {
		console.dir( a );
		console.dir( b );
		throw new Error( `They don\'t match` );
	}
	console.log( `${a.name} OK`);
};

const feedBlobs = ( client, container, queue, check, token ) => {
	return client.listBlobsAsync( container, token )
		.then( ( result ) => {
			result.entries.forEach( e => queue.push( e ) );
			check();
			if ( result.continuationToken ) {
				return feedBlobs( client, container, queue, check, result.continuationToken );
			}
		} );
};

const compareContainers = ( sourceClient, destinationClient, container ) => {
	const sourceBlobs = [];
	const destinationBlobs = [];

	const checkBlobs = () => {
		while ( 0 < sourceBlobs.length && 0 < destinationBlobs.length ) {
			checkPair( sourceBlobs.shift(), destinationBlobs.shift() );
		}
	};

	return Promise.all( [
		feedBlobs( sourceClient, container, sourceBlobs, checkBlobs ),
		feedBlobs( destinationClient, container, destinationBlobs, checkBlobs ),
	] );
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
