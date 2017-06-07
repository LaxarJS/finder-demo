/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns',
   './messages'
], function( ng, ax, patterns, messages ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * API description: https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search
    *
    * Unfortunately search is only possible via the XML API. Only requests for specific items (artists etc.)
    * can be made using JSON as content type. The according API for these requests is documented here:
    * https://wiki.musicbrainz.org/Development/JSON_Web_Service
    *
    * @type {string}
    */
   var searchUrl = 'http://musicbrainz.org/ws/2/artist/?query=artist:';
   var releaseGroupUrl =
      'http://musicbrainz.org/ws/2/release-group?limit=100&query=primarytype:album+AND+status:official+AND+' +
      [ 'audiobook', 'compilation', 'interview', 'live', 'remix', 'soundtrack', 'spokenword' ]
         .reduce( function( acc, type ) {
            return acc + 'NOT+secondarytype:' + type + '+AND+';
         }, '' ) + 'arid:';
   var releasesQueryUrl = 'http://musicbrainz.org/ws/2/release?query=';
   var releaseGroupCoverArtUrlTemplate = 'http://coverartarchive.org/release-group/{releaseGroupId}/front';

   var RELEASE_ID_KEY = 'reid:';

   Controller.$inject = [ '$scope', '$http', '$q', 'finderDemoUtilities', 'axI18n' ];

   function Controller( $scope, $http, $q, finderDemoUtils, i18n ) {

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

      var stateHandler =
         finderDemoUtils.stateWatcherFor( $scope, 'model.selectedArtist', 'resources.search.queryString' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.$watch( 'model.selectedArtist', function( selectedArtist ) {
         $scope.model.selectedArtistReleases = [];
         $scope.model.selectedArtistActiveSince = null;

         if( selectedArtist ) {
            $scope.model.selectedArtistActiveSince = selectedArtist.lifeSpanBegin.substr( 0, 4 );
            queryDetailsForArtist( selectedArtist )
               .then( function( releases ) {
                  $scope.model.selectedArtistReleases = releases;
               } );
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.functions = {

         state: stateHandler.currentState,

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         imageSourceForReleaseGroupCover: function( releaseGroup ) {
            return releaseGroupCoverArtUrlTemplate.replace( '{releaseGroupId}', releaseGroup.id );
         }

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function searchForResults() {
         stateHandler.searchStarted();
         $scope.model.selectedArtist = null;

         return $http.get( searchUrl + encodeURIComponent( $scope.resources.search.queryString ) )
            .then( function( response ) {
               var results = parseArtistXml( response.data );
               $scope.model.results = results;

               if( results.length ) {
                  $scope.model.selectedArtist = results[ 0 ];
               }
            } )
            .catch( function( err ) {
               ax.log.error( err );
            } )
            .finally( stateHandler.searchFinished );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function queryDetailsForArtist( artist ) {
         return $http.get( releaseGroupUrl + encodeURIComponent( artist.id ) )
            .then( function( response ) {
               return parseReleaseGroupsXml( response.data );
            } )
            .then( function( releaseGroups ) {
               var promises = releaseGroups.map( function( releaseGroup ) {

                  // Here we only fetch the releases, to derive the first release date of a release group.
                  // If this ticket would have been fixed, this would not have been necessary:
                  // http://tickets.musicbrainz.org/browse/MBS-2767
                  var idString = releaseGroup.releaseIds
                     .map( function( id ) {
                        return RELEASE_ID_KEY + id;
                     } ).join( ' ' );

                  return $http.get( releasesQueryUrl + encodeURIComponent( idString ) )
                     .then( function( response ) {
                        var firstRelease = parseReleasesXml( response.data )
                           .filter( function( release ) {
                              return !!release.date && release.date.length >= 4;
                           } )
                           .sort( function( a, b ) {
                              var aDate = a.date;
                              var bDate = b.date;
                              return aDate < bDate ? -1 : ( aDate > bDate ? 1 : 0 );
                           } )[ 0 ] || null;

                        releaseGroup.firstReleaseYear = firstRelease ? firstRelease.date.substr( 0, 4 ) : '?';
                        return releaseGroup;
                     }, function( err ) {
                        ax.log.error( 'Failed to fetch first release year for [0:%o]. Error: [1:%o]', releaseGroup, err );
                        releaseGroup.firstReleaseYear = '?';
                        return releaseGroup;
                     } )
                     .then();
               } );
               return $q.all( promises );
            } )
            .then( function( results ) {
               return results.sort( function( a, b ) {
                     var aDate = a.firstReleaseYear;
                     var bDate = b.firstReleaseYear;
                     return aDate < bDate ? -1 : ( aDate > bDate ? 1 : 0 );
                  } );
            } )
            .catch( function( err ) {
               ax.log.error( err );
               return [];
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function parseArtistXml( xmlResponse ) {
         var node = finderDemoUtils.parseXml( xmlResponse );
         var artistNodes =
            toArray( node.documentElement.querySelectorAll( 'metadata > artist-list > artist' ) || [] );

         return artistNodes.map( function( artistNode ) {
            return {
               id: artistNode.getAttribute( 'id' ) || null,
               type: artistNode.getAttribute( 'type' ) || null,
               name: nodeContent( artistNode, 'name' ),
               areaName: nodeContent( artistNode, 'area > name', '?' ),
               lifeSpanBegin: nodeContent( artistNode, 'life-span > begin', '?' ),
               lifeSpanEnd: nodeContent( artistNode, 'life-span > ended' ),
               tags: toArray( node.documentElement.querySelectorAll( 'tag-list > tag > name' ) || [] )
                  .map( function( tagNode ) {
                     return tagNode.textContent;
                  } )
            };
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function parseReleaseGroupsXml( xmlResponse ) {
         var node = finderDemoUtils.parseXml( xmlResponse );
         var releaseGroupNodes =
            toArray( node.documentElement.querySelectorAll( 'metadata > release-group-list > release-group' ) || [] );

         return releaseGroupNodes.map( function( releaseGroupNode ) {
            return {
               id: releaseGroupNode.getAttribute( 'id' ) || null,
               title: nodeContent( releaseGroupNode, 'title' ),
               date: null,
               releaseIds: toArray( releaseGroupNode.querySelectorAll( 'release-list > release' ) )
                  .map( function( releaseNode ) {
                     return releaseNode.getAttribute( 'id' );
                  } )
            };
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function parseReleasesXml( xmlResponse ) {
         var node = finderDemoUtils.parseXml( xmlResponse );
         var releaseNodes =
            toArray( node.documentElement.querySelectorAll( 'metadata > release-list > release' ) || [] );

         return releaseNodes.map( function( releaseNode ) {
            var releaseGroup = releaseNode.querySelector( 'release-group' );
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function nodeContent( node, selector, defaultValue ) {
         var childNode = node.querySelector( selector );
         if( childNode && 'textContent' in childNode ) {
            return childNode.textContent;
         }

         return arguments.length >= 3 ? defaultValue : null;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function toArray( arrayLike ) {
         return Array.prototype.slice.call( arrayLike, 0 );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'musicBrainzSearchWidget', [] )
      .controller( 'MusicBrainzSearchWidgetController', Controller )
      .directive( 'musicBrainzSearchWidgetCoverVisibility', [ function() {
         return {
            link: function( scope, element ) {

               var img = element[ 0 ].querySelector( 'img' );

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
      } ] );

} );
