const azureStorage = require( 'azure-storage' );

class TableClient {
	constructor( config ) {
		this._client = new azureStorage.TableService( config );
	}

	createTableIfNotExistsAsync( container ) {
		return new Promise( ( resolve, reject ) => {
			this._client.createTableIfNotExists( container, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}

	listTablesAsync( token ) {
		return new Promise( ( resolve, reject ) => {
			this._client.listTablesSegmented( token, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}

	listAllEntitiesAsync( table, token ) {
		return new Promise( ( resolve, reject ) => {
			const query = new azureStorage.TableQuery();
			this._client.queryEntities( table, query, token, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}

	createEntitiesAsync( table, entities ) {
		return new Promise( ( resolve, reject ) => {
			const batch = new azureStorage.TableBatch();
			entities.forEach( ( entity ) => {
				batch.insertOrReplaceEntity( entity );
			} );

			this._client.executeBatch( table, batch, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}
}

module.exports = TableClient;
