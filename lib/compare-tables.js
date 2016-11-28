const _ = require( 'lodash' );
const Client = require( './table-client' );

const getAllTables = ( client, token ) => {
	const tables = [];
	return client.listTablesAsync( token )
		.then( ( result ) => {
			result.entries.forEach( ( entry ) => tables.push( entry ) );
			if ( result.continuationToken ) {
				return client.listTablesAsync( client, result.continuationToken );
			}
		} )
		.then( ( result ) => {
			if ( result ) {
				result.entries.forEach( ( entry ) => tables.push( entry ) );
			}

			return tables;
		} );
};

const feedTableEntities = ( client, table, addEntities, token ) => {
	return client.listAllEntitiesAsync( table, token )
		.then( ( result ) => {
			addEntities( result.entries );
			if ( result.continuationToken ) {
				return feedTableEntities( client, table, addEntities, result.continuationToken );
			}
		} );
};

const compareEntities = ( a, b ) => {
	if ( ! _.isEqual( _.omit( a, [ 'Timestamp', '.metadata' ] ), _.omit( b, [ 'Timestamp', '.metadata' ] ) ) ) {
		console.dir( _.omit( a, [ 'Timestamp', '.metadata' ] ) );
		console.dir( _.omit( b, [ 'Timestamp', '.metadata' ] ) );
		return false;
	}

	return true;
};

const compareTablePair = ( sourceClient, destinationClient, table ) => {
	console.log( `Checking table: ${table}` );
	const sourceEntities = {};
	const destinationEntities = {};
	let counter = 0;

	const checkEntities = () => {
		const commonKeys = _.intersection( _.keys( sourceEntities ), _.keys( destinationEntities ) );
		const allPass = _.every( commonKeys, ( k ) => compareEntities( sourceEntities[ k ], destinationEntities[ k ] ) );
		if ( ! allPass ) {
			throw new Error( 'A pair of entities mismatched' );
		}

		counter += commonKeys.length;
		commonKeys.forEach( ( k ) => {
			delete sourceEntities[ k ];
			delete destinationEntities[ k ];
		} );
	};

	const addSourceEntities = ( entries ) => {
		_.forEach( entries, e => sourceEntities[ `${e.PartitionKey._} + ${e.RowKey._}` ] = e );
		checkEntities();
	};
	const addDestinationEntities = ( entries ) => {
		_.forEach( entries, e => destinationEntities[ `${e.PartitionKey._} + ${e.RowKey._}` ] = e );
		checkEntities();
	};
	const feedTasks = [
		feedTableEntities( sourceClient, table, addSourceEntities ),
		feedTableEntities( destinationClient, table, addDestinationEntities ),
	];

	return Promise.all( feedTasks )
		.then( () => {
			if ( 0 < _.keys( sourceEntities ).length || 0 < _.keys( destinationEntities ).length ) {
				console.dir( sourceEntities );
				console.dir( destinationEntities );
				throw new Error( 'Mismatch in table entities' );
			}

			console.log( `Successfully compared ${counter} table entities` );
		} );
};

const compareTables = ( source, destination ) => {
	const sourceClient = new Client( source );
	const destinationClient = new Client( destination );

	return Promise.all( [ getAllTables( sourceClient ), getAllTables( destinationClient ) ] )
		.then( _.spread( ( src, dst ) => {
			if ( ! _.isEqual( src, dst ) ) {
				console.dir( _.zip( src, dst ) );
				throw new Error( 'Mismatch in account table names' );
			}
			console.log( 'Table names in account are identical' );
			return src;
		} ) )
		.then( ( tables ) => {
			const reducer = ( task, table ) => task.then( () => compareTablePair( sourceClient, destinationClient, table ) );
			return _.reduce( tables, reducer, Promise.resolve() );
		} );
};

module.exports = compareTables;
