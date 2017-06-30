/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 */

import * as ng from 'angular';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';
import { messages } from './messages';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * API description: http://en.wikipedia.org/w/api.php?action=help&modules=query%2Bsearch
 *
 * Unfortunately it is not possible to get an extract directly via this API. Instead one has to use
 * another url using the url encoded title of the desired article and append it to this url:
 * http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=
 *
 * @type {string}
 */

Controller.$inject = [ '$scope', '$http', '$sce', 'finderDemoUtilities', 'axI18n', 'axLog' ];

function Controller( $scope, $http, $sce, finderDemoUtils, i18n, log ) {

   const searchUrl = 'http://[languageTag].wikipedia.org/w/api.php?' +
                     'action=query&list=search&continue=&format=json&srsearch=';
   const extractsUrl = 'http://[languageTag].wikipedia.org/w/api.php?' +
                       'action=query&prop=extracts|pageimages&exintro=&exlimit=10&pilimit=5&' +
                       'continue=&format=json&titles=';
   const imagesUrl = 'http://[languageTag].wikipedia.org/w/api.php?' +
                     'action=query&prop=imageinfo&iiprop=url&continue=&format=json&titles=';
   const externalLinkPrefix = 'http://[languageTag].wikipedia.org/wiki/';

   $scope.messages = messages;
   $scope.i18n = i18n;

   patterns.i18n.handlerFor( $scope, i18n ).registerLocaleFromFeature( 'i18n' );

   $scope.resources = {};
   $scope.model = {
      selectedArticle: null,
      selectedArticleExtract: null,
      selectedArticleImage: null,
      results: [],
      resultCount: 0
   };

   patterns.resources.handlerFor( $scope )
      .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );

   const stateHandler = finderDemoUtils.stateWatcherFor(
      $scope, 'model.selectedArticle', 'resources.search.queryString' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.$watch( 'model.selectedArticle', selectedArticle => {
      $scope.model.selectedArticleExtract = null;
      $scope.model.selectedArticleImage = null;

      if( selectedArticle ) {
         queryDetailsForArticle( selectedArticle )
            .then( details => {
               $scope.model.selectedArticleExtract = $sce.trustAsHtml( details.extract );
               $scope.model.selectedArticleImage = details.images[ 0 ] || null;
            } );
      }
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.functions = {

      state: stateHandler.currentState,

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      wikiLink( article ) {
         const url = ax.string.format( externalLinkPrefix, { languageTag: $scope.i18n.tags[ 'default' ] } );
         return url + encodeURIComponent( article.title );
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function searchForResults() {
      stateHandler.searchStarted();
      $scope.model.selectedArticle = null;

      let url = ax.string.format( searchUrl, { languageTag: $scope.i18n.tags[ 'default' ] } );
      url = $sce.trustAsResourceUrl( url + encodeURIComponent( $scope.resources.search.queryString ) );
      $http.jsonp( url )
         .then( response => {
            const results = ax.object.path( response.data, 'query.search', [] );
            $scope.model.resultCount = ax.object.path( response.data, 'query.searchinfo.totalhits', 0 );
            $scope.model.results = results;

            if( results.length ) {
               $scope.model.selectedArticle = results[ 0 ];
            }
         } )
         .catch( err => {
            log.error( err );
         } )
         .finally( stateHandler.searchFinished );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function queryDetailsForArticle( article ) {

      let url = ax.string.format( extractsUrl, { languageTag: $scope.i18n.tags[ 'default' ] } );
      url = $sce.trustAsResourceUrl( url + article.title );
      return $http.jsonp( url )
         .then( response => {
            const pages = ax.object.path( response.data, 'query.pages', {} );

            const extract = pages[ Object.keys( pages )[ 0 ] ];
            const details = {
               extract: extract.extract,
               images: []
            };

            if( extract.pageimage ) {
               let imageUrl = ax.string.format( imagesUrl, { languageTag: $scope.i18n.tags[ 'default' ] } );
               imageUrl = $sce.trustAsResourceUrl(
                  `${imageUrl}File:${encodeURIComponent( extract.pageimage )}` );

               return $http.jsonp( imageUrl )
                  .then( response => {
                     const pages = ax.object.path( response.data, 'query.pages', {} );
                     Object.keys( pages ).forEach( key => {
                        if( pages[ key ].imageinfo &&
                            pages[ key ].imageinfo[ 0 ] && pages[ key ].imageinfo[ 0 ].url ) {
                           details.images.push( pages[ key ].imageinfo[ 0 ].url );
                        }
                     } );
                     return details;
                  } );
            }

            return details;
         } )
         .catch( err => {
            log.error( err );
            return {
               extract: null,
               images: []
            };
         } );
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'wikipediaSearchWidget', [] )
      .controller( 'WikipediaSearchWidgetController', Controller ).name;
