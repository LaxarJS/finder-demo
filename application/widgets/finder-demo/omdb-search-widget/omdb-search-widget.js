/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */

import * as ng from 'angular';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';
import { messages } from './messages';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * API description: http://www.omdbapi.com/
    * Since 05/08/2017 a private key is necessary
    * @type {string}
    */

Controller.$inject = [ '$scope', '$http', '$sce', 'finderDemoUtilities', 'axLog', 'axI18n' ];

function Controller( $scope, $http, $sce, finderDemoUtils, log, i18n ) {

   const searchUrl = 'http://www.omdbapi.com/?y=&plot=short&r=json&s=';
   const detailsUrl = 'http://www.omdbapi.com/?tomatoes=true&plot=full&r=json&i=';

   $scope.messages = messages;
   $scope.i18n = i18n;

   patterns.i18n.handlerFor( $scope ).registerLocaleFromFeature( 'i18n' );

   $scope.resources = {};
   $scope.model = {
      imdbPrefix: 'http://www.imdb.com/title/',
      selectedMovie: null,
      selectedMovieDetails: null,
      results: [],
      pendingSearches: 0,
      details: [
         { label: 'YEAR_OF_PUBLICATION', key: 'Year' },
         { label: 'RUNTIME', key: 'Runtime' },
         { label: 'GENRE', key: 'Genre' },
         { label: 'IMDB_RATING', key: 'imdbRating' }
      ]
   };

   patterns.resources.handlerFor( $scope )
      .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );

   const stateHandler =
      finderDemoUtils.stateWatcherFor( $scope, 'model.selectedMovie', 'resources.search.queryString' );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.$watch( 'model.selectedMovie', selectedMovie => {
      $scope.model.selectedMovieDetails = null;

      if( selectedMovie ) {
         queryDetailsForMovie( selectedMovie )
            .then( details => {
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
      const url = $sce.trustAsResourceUrl(
         searchUrl + encodeURIComponent( $scope.resources.search.queryString ) );

      $http.get( url )
         .then( response => {
            const results = ax.object.path( response.data, 'Search', [] );
            $scope.model.results = results;

            if( results.length > 0 ) {
               $scope.model.selectedMovie = results[ 0 ];
            }
         } )
         .catch( err => {
            log.error( err );
         } )
         .finally( stateHandler.searchFinished );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function queryDetailsForMovie( movie ) {
      const url = $sce.trustAsResourceUrl( detailsUrl + encodeURIComponent( movie.imdbID ) );
      return $http.get( url )
         .then( response => {
            return response.data;
         } )
         .catch( err => {
            log.error( err );
         } );
   }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'omdbSearchWidget', [] )
   .controller( 'OmdbSearchWidgetController', Controller ).name;
