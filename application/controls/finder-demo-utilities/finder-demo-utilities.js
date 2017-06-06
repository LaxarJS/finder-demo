/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar'
], function( ng, ax ) {
   'use strict';

   var module = ng.module( 'finderDemoUtilities', [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.filter( 'urlEncode', function() {
      return function( uriComponent ) {
         return encodeURIComponent( uriComponent );
      };
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.factory( 'finderDemoUtilities', [ function() {

      return {
         stateWatcherFor: stateWatcherFor,
         parseXml: parseXml
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function stateWatcherFor( scope, selectionModelKey, queryStringKey ) {

         var pendingSearches = 0;

         return {

            searchStarted: function() {
               ++pendingSearches;
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            searchFinished: function() {
               --pendingSearches;
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            currentState: function() {
               if( pendingSearches > 0 ) {
                  return 'SEARCHING';
               }

               if( ax.object.path( scope, selectionModelKey, null ) ) {
                  return 'SELECTED';
               }

               if( ax.object.path( scope, queryStringKey, null ) ) {
                  return 'NO_RESULTS';
               }

               return 'IDLE';
            }

         };
      }
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function parseXml( xmlString ) {
         if( typeof window.DOMParser !== 'undefined' ) {
            return ( new window.DOMParser() ).parseFromString( xmlString, 'text/xml' );
         }

         if( typeof window.ActiveXObject !== 'undefined' &&
            new window.ActiveXObject( 'Microsoft.XMLDOM' ) ) {
            var xmlDoc = new window.ActiveXObject( 'Microsoft.XMLDOM' );
            xmlDoc.async = 'false';
            xmlDoc.loadXML( xmlString );
            return xmlDoc;
         }

         throw new Error( 'No XML parser found' );
      }

   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );