/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'laxar',
   'laxar-patterns',
   'fetch', // will directly change the global object
   'promise-polyfill' // will directly change the global object
], function( ax, patterns ) {
   'use strict';

   /**
    * Uses nominatim for Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim
    *
    * @type {string}
    */
   var locationSearchUrl = 'http://nominatim.openstreetmap.org/search?format=json&polygon=0&addressdetails=1&q=';

   var injections = [ 'axEventBus', 'axContext' ];

   function create( eventBus, context ) {

      var nextSearchId = 0;

      context.resources = {};
      patterns.resources.handlerFor( context )
         .registerResourceFromFeature( 'search', { onUpdateReplace: searchForLocations } );

      var locationsPublisher = patterns.resources.replacePublisherForFeature( context, 'locations' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function searchForLocations() {
         publishSearchingFlagState( true );

         var currentSearchId = nextSearchId++;
         window.fetch( locationSearchUrl + encodeURIComponent( context.resources.search.queryString ) )
            .then( function( response ) {
               return response.json();
            } )
            .then( function( parsedJson ) {
               if( currentSearchId + 1 === nextSearchId ) {
                  locationsPublisher( parsedJson );
               }
               // skip old searches
            }, function( err ) {
               ax.log.error( err );
            } )
            .then( function() {
               if( currentSearchId + 1 === nextSearchId ) {
                  publishSearchingFlagState( false );
               }
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishSearchingFlagState( searching ) {
         if( !context.features.locations.searching ) {
            return;
         }

         eventBus.publish( 'didChangeFlag.' + context.features.locations.searching + '.' + searching, {
            flag: context.features.locations.searching,
            state: searching
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      injections: injections,
      create: create,
      name: 'geocodingActivity'
   };

} );
