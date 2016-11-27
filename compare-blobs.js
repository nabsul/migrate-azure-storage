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

const compareBlobs = ( source, destination ) => {
	const sourceClient = new Client( source );
	const destinationClient = new Client( destination );

	return Promise.all( [ getAllContainers( sourceClient ), getAllContainers( destinationClient ) ] )
		.then( _.spread( ( src, dst ) => {
			const result = _.isEqual( src, dst );
			console.log( `Container names: ${result}` );
		} ) );
};

module.exports = compareBlobs;
