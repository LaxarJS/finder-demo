/**
 * Copyright 2015 LaxarJS
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
    * API description: http://www.omdbapi.com/
    *
    * @type {string}
    */
   var url = 'http://www.omdbapi.com/?y=&plot=short&r=json&s=';
   var detailsUrl = 'http://www.omdbapi.com/?tomatoes=true&plot=full&r=json&i=';

   Controller.$inject = [ '$scope', '$http', 'finderDemoUtilities' ];

   function Controller( $scope, $http, finderDemoUtils ) {

      $scope.messages = messages;

      patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n' );

      $scope.resources = {};
      $scope.model = {
         imdbPrefix: 'http://www.imdb.com/title/',
         selectedMovie: null,
         selectedMovieDetails: null,
         results: [],
         pendingSearches: 0,
         details: [
            { label: 'Erscheinungsjahr', key: 'Year' },
            { label: 'Laufzeit', key: 'Runtime' },
            { label: 'Genre', key: 'Genre' },
            { label: 'IMDb Bewertung', key: 'imdbRating' }
         ]
      };

      patterns.resources.handlerFor( $scope )
         .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );

      var stateHandler =
         finderDemoUtils.stateWatcherFor( $scope, 'model.selectedMovie', 'resources.search.queryString' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.$watch( 'model.selectedMovie', function( selectedMovie ) {
         $scope.model.selectedMovieDetails = null;

         if( selectedMovie ) {
            queryDetailsForMovie( selectedMovie )
               .then( function( details ) {
                  $scope.model.selectedMovieDetails = details;
               } );
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.functions = {

         state: stateHandler.currentState

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function searchForResults() {
         stateHandler.searchStarted();
         $scope.model.selectedMovie = null;

         $http.get( url + encodeURIComponent( $scope.resources.search.queryString ) )
            .then( function( response ) {
               var results = ax.object.path( response.data, 'Search', [] );
               $scope.model.results = results;

               if( results.length > 0 ) {
                  $scope.model.selectedMovie = results[ 0 ];
               }
            } )
            .catch( function( err ) {
               ax.log.error( err );
            } )
            .finally( stateHandler.searchFinished );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function queryDetailsForMovie( movie ) {
         return $http.get( detailsUrl + encodeURIComponent( movie.imdbID ) )
            .then( function( response ) {
               return response.data;
            } )
            .catch( function( err ) {
               ax.log.error( err );
            } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'omdbSearchWidget', [] ).controller( 'OmdbSearchWidgetController', Controller );

} );
