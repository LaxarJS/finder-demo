/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'laxar',
   'laxar-patterns',
   'whatwg-fetch', // will directly change the global object
   'promise-polyfill' // will directly change the global object
], ( ax, patterns ) => {
   'use strict';

   /**
    * Uses nominatim for Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim
    *
    * @type {string}
    */
   const locationSearchUrl = 'http://nominatim.openstreetmap.org/search?format=json&polygon=0&addressdetails=1&q=';

   const injections = [ 'axEventBus', 'axContext', 'axStorage' ];

   function create( eventBus, context, storage ) {
      //StorageFactory.getApplicationLocalStorage()
      const cache = storage.session;//.getItem( `geocodingActivity-${context.widget.id}` );
      let nextSearchId = 0;

      context.resources = {};
      patterns.resources.handlerFor( context )
         .registerResourceFromFeature( 'search', { onUpdateReplace: searchForLocations } );

      const locationsPublisher = patterns.resources.replacePublisherForFeature( context, 'locations' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function searchForLocations() {
         publishSearchingFlagState( true );

         const currentSearchId = nextSearchId++;
         const url = locationSearchUrl + encodeURIComponent( context.resources.search.queryString );
         const cachedEntry = cache.getItem( url );
         let jsonResultPromise;

         if( cachedEntry ) {
            ax.log.trace(
               'Fetched location search for "[0]" from cache.',
               context.resources.search.queryString
            );
            jsonResultPromise = Promise.resolve( cachedEntry );
         }
         else {
            jsonResultPromise = window.fetch( url )
               .then( response => {
                  return response.json();
               } )
               .then( parsedJson => {
                  cache.setItem( url, parsedJson );
                  return parsedJson;
               } );
         }

         jsonResultPromise
            .then( parsedJson => {
               if( currentSearchId + 1 === nextSearchId ) {
                  locationsPublisher( parsedJson );
               }
               // skip old searches
            }, err => {
               ax.log.error( err );
            } )
            .then( () => {
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

         eventBus.publish( `didChangeFlag.${context.features.locations.searching}.${searching}`, {
            flag: context.features.locations.searching,
            state: searching
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      injections,
      create,
      name: 'geocoding-activity'
   };

} );
