const _ = require( 'lodash' );
const Client = require( './lib/table-client' );

const getAllTables = ( client, token ) => {
	const tables = [];
	return client.listTablesAsync( token )
		.then( ( result ) => {
			result.entries.forEach( ( entry ) => tables.push( entry ) );
			if ( result.continuationToken ) {
				return listTablesAsync( client, result.continuationToken );
			}
		} )
		.then( ( result ) => {
			if ( result ) {
				result.entries.forEach( ( entry ) => tables.push( entry ) );
			}

			return tables;
		} );
};

const compareTables = ( source, destination ) => {
	const sourceClient = new Client( source );
	const destinationClient = new Client( destination );

	return Promise.all( [ getAllTables( sourceClient ), getAllTables( destinationClient ) ] )
		.then( _.spread( ( src, dst ) => {
			const result = _.isEqual( src, dst );
			console.log( `Table names: ${result}` );
		} ) );
};

module.exports = compareTables;
