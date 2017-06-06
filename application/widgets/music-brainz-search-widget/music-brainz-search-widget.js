/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import * as ng from 'angular';
import * as patterns from 'laxar-patterns';
import { messages } from './messages';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * API description: https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search
 *
 * Unfortunately search is only possible via the XML API. Only requests for specific items (artists etc.)
 * can be made using JSON as content type. The according API for these requests is documented here:
 * https://wiki.musicbrainz.org/Development/JSON_Web_Service
 *
 * @type {string}
 */

Controller.$inject = [ '$scope', '$http', '$q', '$sce', 'finderDemoUtilities', 'axI18n', 'axLog' ];

function Controller( $scope, $http, $q, $sce, finderDemoUtils, i18n, log ) {

   const searchUrl = 'http://musicbrainz.org/ws/2/artist/?query=artist:';
   const releaseGroupUrl =
      `http://musicbrainz.org/ws/2/release-group?limit=100&query=primarytype:album+AND+status:official+AND+${
      [ 'audiobook', 'compilation', 'interview', 'live', 'remix', 'soundtrack', 'spokenword' ]
         .reduce( ( acc, type ) => {
            return `${acc}NOT+secondarytype:${type}+AND+`;
         }, '' )}arid:`;
   const releasesQueryUrl = 'http://musicbrainz.org/ws/2/release?query=';
   const releaseGroupCoverArtUrlTemplate = 'http://coverartarchive.org/release-group/{releaseGroupId}/front';

   const RELEASE_ID_KEY = 'reid:';

   $scope.messages = messages;
   $scope.i18n = i18n;

   patterns.i18n.handlerFor( $scope ).registerLocaleFromFeature( 'i18n' );

   $scope.resources = {};
   $scope.model = {
      musicBrainzPrefix: 'http://musicbrainz.org/artist/',
      selectedArtist: null,
      selectedArtistActiveSince: null,
      selectedArtistReleases: [],
      result: []
   };

   patterns.resources.handlerFor( $scope )
      .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );

   const stateHandler =
      finderDemoUtils.stateWatcherFor( $scope, 'model.selectedArtist', 'resources.search.queryString' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.$watch( 'model.selectedArtist', selectedArtist => {
      $scope.model.selectedArtistReleases = [];
      $scope.model.selectedArtistActiveSince = null;

      if( selectedArtist ) {
         $scope.model.selectedArtistActiveSince = selectedArtist.lifeSpanBegin.substr( 0, 4 );
         queryDetailsForArtist( selectedArtist )
            .then( releases => {
               $scope.model.selectedArtistReleases = releases;
            } );
      }
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.functions = {

      state: stateHandler.currentState,

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      imageSourceForReleaseGroupCover( releaseGroup ) {
         return releaseGroupCoverArtUrlTemplate.replace( '{releaseGroupId}', releaseGroup.id );
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function searchForResults() {
      stateHandler.searchStarted();
      $scope.model.selectedArtist = null;

      return $http.get( searchUrl + encodeURIComponent( $scope.resources.search.queryString ) )
         .then( response => {
            const results = parseArtistXml( response.data );
            $scope.model.results = results;

            if( results.length ) {
               $scope.model.selectedArtist = results[ 0 ];
            }
         } )
         .catch( err => {
            log.error( err );
         } )
         .finally( stateHandler.searchFinished );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function queryDetailsForArtist( artist ) {
      return $http.get( releaseGroupUrl + encodeURIComponent( artist.id ) )
         .then( response => {
            return parseReleaseGroupsXml( response.data );
         } )
         .then( releaseGroups => {
            const promises = releaseGroups.map( releaseGroup => {

               // Here we only fetch the releases, to derive the first release date of a release group.
               // If this ticket would have been fixed, this would not have been necessary:
               // http://tickets.musicbrainz.org/browse/MBS-2767
               const idString = releaseGroup.releaseIds
                  .map( id => {
                     return RELEASE_ID_KEY + id;
                  } ).join( ' ' );

               return $http.get( releasesQueryUrl + encodeURIComponent( idString ) )
                  .then( response => {
                     const firstRelease = parseReleasesXml( response.data )
                        .filter( release => {
                           return !!release.date && release.date.length >= 4;
                        } )
                        .sort( ( a, b ) => {
                           const aDate = a.date;
                           const bDate = b.date;
                           if( aDate === bDate ) {
                              return 0;
                           }
                           return aDate < bDate ? -1 : 1;
                        } )[ 0 ] || null;

                     releaseGroup.firstReleaseYear = firstRelease ? firstRelease.date.substr( 0, 4 ) : '?';
                     return releaseGroup;
                  }, err => {
                     log.error(
                        'Failed to fetch first release year for [0:%o]. Error: [1:%o]',
                        releaseGroup, err );
                     releaseGroup.firstReleaseYear = '?';
                     return releaseGroup;
                  } )
                  .then();
            } );
            return $q.all( promises );
         } )
         .then( results => {
            return results.sort( ( a, b ) => {
               const aDate = a.firstReleaseYear;
               const bDate = b.firstReleaseYear;
               if( aDate === bDate ) {
                  return 0;
               }
               return aDate < bDate ? -1 : 1;
            } );
         } )
         .catch( err => {
            log.error( err );
            return [];
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function parseArtistXml( xmlResponse ) {
      if( !Array.isArray( xmlResponse.artists ) ) { return []; }
      return xmlResponse.artists.map( artist => {
         return {
            id: artist.id || null,
            type: artist.type || null,
            name: artist.name,
            areaName: artist.area ? artist.area.name || '?' : '?',
            lifeSpanBegin: artist[ 'life-span' ].begin || '?',
            lifeSpanEnd: artist[ 'life-span' ].ended || false,
            tags: Array.isArray( artist.tags ) ? artist.tags.map( tagNode => {
               return tagNode ? tagNode.name : '';
            } ) : []
         };
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function parseReleaseGroupsXml( xmlResponse ) {
      const node = finderDemoUtils.parseXml( xmlResponse );
      const releaseGroupNodes = toArray(
         node.documentElement.querySelectorAll( 'metadata > release-group-list > release-group' ) || [] );

      return releaseGroupNodes.map( releaseGroupNode => {
         return {
            id: releaseGroupNode.getAttribute( 'id' ) || null,
            title: nodeContent( releaseGroupNode, 'title' ),
            date: null,
            releaseIds: toArray( releaseGroupNode.querySelectorAll( 'release-list > release' ) )
               .map( releaseNode => {
                  return releaseNode.getAttribute( 'id' );
               } )
         };
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function parseReleasesXml( xmlResponse ) {
      const node = finderDemoUtils.parseXml( xmlResponse );
      const releaseNodes =
         toArray( node.documentElement.querySelectorAll( 'metadata > release-list > release' ) || [] );

      return releaseNodes.map( releaseNode => {
         const releaseGroup = releaseNode.querySelector( 'release-group' );
         return {
            id: releaseNode.getAttribute( 'id' ) || null,
            title: nodeContent( releaseNode, 'title' ),
            date: nodeContent( releaseNode, 'date' ),
            status: nodeContent( releaseNode, 'status' ),
            releaseGroupId: releaseGroup.getAttribute( 'id' ),
            releaseGroupPrimaryType: nodeContent( releaseGroup, 'primary-type' ),
            releaseGroupSecondaryType: nodeContent( releaseGroup, 'secondary-type' )
         };
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function nodeContent( node, selector, defaultValue ) {
      const childNode = node.querySelector( selector );
      if( childNode && 'textContent' in childNode ) {
         return childNode.textContent;
      }

      return arguments.length >= 3 ? defaultValue : null;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function toArray( arrayLike ) {
      return Array.prototype.slice.call( arrayLike, 0 );
   }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'musicBrainzSearchWidget', [] )
   .controller( 'MusicBrainzSearchWidgetController', Controller )
   .directive( 'musicBrainzSearchWidgetCoverVisibility', [ function() {
      return {
         link( scope, element ) {

            const img = element[ 0 ].querySelector( 'img' );

            if( imageOkay( img ) ) {
               show();
               return;
            }

            img.onload = show;
            img.onerror = function() {
               element.addClass( 'ax-omitted' );
            };

            function show() {
               if( imageOkay( img ) ) {
                  element.removeClass( 'ax-invisible' );
               }
            }

            function imageOkay( img ) {
               if( !img.complete ) {
                  return false;
               }
               if( typeof img.naturalWidth !== 'undefined' && img.naturalWidth === 0 ) {
                  return false;
               }
               return true;
            }
         }
      };
   } ] ).name;
