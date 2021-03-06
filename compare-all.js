const _ = require( 'lodash' );
const config = require( 'config' );
const compareBlobs = require( './lib/compare-blobs' );
const compareTables = require( './lib/compare-tables' );

const compareData = ( name, source, destination ) => {
	console.log( `Comparing: ${name}` );
	return compareBlobs( source, destination )
		.then( () => compareTables( source, destination ) );
};

const chainTasks = ( task, account ) => {
	return task.then( () => compareData( account.name, account.source, account.destination ) );
};

const accounts = config.get( 'accounts' );

_.reduce( accounts, chainTasks, Promise.resolve() )
	.then( () => console.log( 'all done' ) )
	.catch( console.dir );
