const _ = require( 'lodash' );
const config = require( 'config' );
const copyBlobs = require( './lib/copy-blobs' );
const copyTables = require( './lib/copy-tables' );

const copyData = ( name, source, destination ) => {
	console.log( `Copying: ${name}` );
	return copyBlobs( source, destination )
		.then( () => {
			copyTables( source, destination );
		} );
};

const chainTasks = ( task, account ) => {
	return task.then( () => copyData( account.name, account.source, account.destination ) );
};

const accounts = config.get( 'accounts' );

_.reduce( accounts, chainTasks, Promise.resolve() )
	.then( () => console.log( 'all done' ) );
