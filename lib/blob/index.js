const azureStorage = require( 'azure-storage' );

class Blob {
	constructor( config ) {
		this._client = new azureStorage.BlobService( config );
	}

	createContainerAsync( container ) {
		return new Promise( ( resolve, reject ) => {
			this._client.createContainer( container, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}

	listContainersAsync( token ) {
		return new Promise( ( resolve, reject ) => {
			this._client.listContainersSegmented( token, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}

	listBlobsAsync( container, token ) {
		return new Promise( ( resolve, reject ) => {
			this._client.listBlobsSegmented( container, token, ( error, result ) => {
				return error ? reject( error ) : resolve( result );
			} );
		} );
	}

	getReadStreamAsync( container, blob ) {
		return new Promise( ( resolve ) => {
			resolve( this._client.createReadStream( container, blob ) );
		} );
	}

	getWriteStreamAsync( container, blob ) {
		return new Promise( ( resolve ) => {
			resolve( this._client.createWriteStreamToBlockBlob( container, blob ) );
		} );
	}
}

module.exports = Blob;
