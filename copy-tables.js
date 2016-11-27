const _ = require( 'lodash' );
const TableClient = require( './lib/table-client' );

const copyTables = ( source, destination ) => {
	const sourceClient = new TableClient( source );
	const destinationClient = new TableClient( destination );

	const insertEntities = ( table, entries ) => {
		const reducer = ( task, batch ) => {
			console.log( `inserting ${batch.length} items into ${batch[ 0 ].PartitionKey._}` );
			return task.then( () => destinationClient.createEntitiesAsync( table, batch ) );
		};

		const groups = _.groupBy( entries, 'PartitionKey._' );
		const batches = _.flatten( _.map( groups, ( group ) => _.chunk( group, 90 ) ) );
		return _.reduce( batches, reducer, Promise.resolve() );
	};

	const processTable = ( table, token ) => {
		console.log( `${token ? 'Continuing' : 'Starting' } on ${table}` );
		return destinationClient.createTableIfNotExistsAsync( table )
			.then( () => {
				return sourceClient.listAllEntitiesAsync( table, token );
			} )
			.then( ( result ) => {
				return insertEntities( table, result.entries )
					.then( () => result );
			} )
			.then( ( result ) => {
				if ( result.continuationToken ) {
					return processTable( table, result.continuationToken );
				}
			} );
	};

	const fetchTables = ( token ) => {
		return sourceClient.listTablesAsync( token )
			.then( ( result ) => {
				const reducer = ( task, table ) => task.then( () => processTable( table ) );
				return _.reduce( result.entries, reducer, Promise.resolve() )
					.then( () => result );
			} )
			.then( ( result ) => {
				if ( result.continuationToken ) {
					return fetchTables( result.continuationToken );
				}
			} );
	};

	return fetchTables();
};

module.exports = copyTables;
