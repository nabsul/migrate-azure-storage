const azureStorage = require( 'azure-storage' );

class TableClient {
	constructor( config ) {
		this._client = new azureStorage.TableService( config );
	}

	createTableAsync( container ) {
		return new Promise( ( resolve, reject ) => {
			this._client.createTable( container, ( error, result ) => {
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

	listAllEntities( table, token ) {
		return new Promise( ( resolve, reject ) => {
			const query = new azureStorage.TableQuery();
			this._client.queryEntities( table, query, token, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}

	createEntities( table, entities ) {
		return new Promise( ( resolve ) => {
			const batch = new azureStorage.TableBatch();
			entities.forEach( ( entity ) => {
				batch.insertOrReplaceEntity( entity );
			} );

			this._client.executeBatch( table, batch, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} )
		} );
	}
}

module.exports = Blob;
