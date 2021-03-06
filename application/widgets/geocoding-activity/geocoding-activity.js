/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import 'whatwg-fetch';// will directly change the global object
import 'promise-polyfill';// will directly change the global object
import * as patterns from 'laxar-patterns';
/**
 * Uses nominatim for Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim
 *
 * @type {string}
 */

export const injections = [ 'axEventBus', 'axContext', 'axStorage', 'axLog' ];

export function create( eventBus, context, storage, log ) {
   const locationSearchUrl = 'http://nominatim.openstreetmap.org/search?' +
                             'format=json&polygon=0&addressdetails=1&q=';

   const cache = storage.session;
   let nextSearchId = 0;

   context.resources = {};
   patterns.resources.handlerFor( context )
      .registerResourceFromFeature( 'search', { onUpdateReplace: searchForLocations } );

   const locationsPublisher = patterns.resources.replacePublisherForFeature( context, 'locations' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function searchForLocations() {
      publishSearchingFlagState( true );

      const currentSearchId = nextSearchId++;
      const url = locationSearchUrl + encodeURIComponent( context.resources.search.queryString );
      const cachedEntry = cache.getItem( url );
      let jsonResultPromise;

      if( cachedEntry ) {
         log.trace(
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
            log.error( err );
         } )
         .then( () => {
            if( currentSearchId + 1 === nextSearchId ) {
               publishSearchingFlagState( false );
            }
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

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
