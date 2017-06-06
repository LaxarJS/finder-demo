/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import { module } from 'angular';
import * as ax from 'laxar';

export const name = module( 'finderDemoUtilities', [] )
   .filter( 'urlEncode', () => {
      return function( uriComponent ) {
         return encodeURIComponent( uriComponent );
      };
   } )
   .factory( 'finderDemoUtilities', [ () => {

      return { stateWatcherFor, parseXml };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function stateWatcherFor( scope, selectionModelKey, queryStringKey ) {

         let pendingSearches = 0;

         return {

            searchStarted: () => {
               ++pendingSearches;
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            searchFinished: () => {
               --pendingSearches;
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            currentState: () => {
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
            const xmlDoc = new window.ActiveXObject( 'Microsoft.XMLDOM' );
            xmlDoc.async = 'false';
            xmlDoc.loadXML( xmlString );
            return xmlDoc;
         }

         throw new Error( 'No XML parser found' );
      }

   } ] )
   .name;
