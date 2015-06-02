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
    * API description: http://en.wikipedia.org/w/api.php?action=help&modules=query%2Bsearch
    *
    * Unfortunately it is not possible to get an extract directly via this API. Instead one has to use
    * another url using the url encoded title of the desired article and append it to this url:
    * http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=
    *
    * @type {string}
    */
   var searchUrl = 'http://de.wikipedia.org/w/api.php?action=query&list=search&continue=&format=json&callback=JSON_CALLBACK&srsearch=';
   var extractsUrl = 'http://de.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=&exlimit=10&pilimit=5&continue=&format=json&callback=JSON_CALLBACK&titles=';
   var imagesUrl = 'http://de.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&continue=&format=json&callback=JSON_CALLBACK&titles=';

   Controller.$inject = [ '$scope', '$http', 'finderDemoUtilities' ];

   function Controller( $scope, $http, finderDemoUtils ) {

      $scope.messages = messages;

      patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n' );

      $scope.resources = {};
      $scope.model = {
         wikiPrefix: 'http://wikipedia.org/wiki/',
         selectedArticle: null,
         selectedArticleExtract: null,
         selectedArticleImage: null,
         results: [],
         resultCount: 0
      };

      patterns.resources.handlerFor( $scope )
         .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );

      var stateHandler =
         finderDemoUtils.stateWatcherFor( $scope, 'model.selectedArticle', 'resources.search.queryString' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.$watch( 'model.selectedArticle', function( selectedArticle ) {
         $scope.model.selectedArticleExtract = null;
         $scope.model.selectedArticleImage = null;

         if( selectedArticle ) {
            queryDetailsForArticle( selectedArticle )
               .then( function( details ) {
                  $scope.model.selectedArticleExtract = details.extract;
                  $scope.model.selectedArticleImage = details.images[ 0 ] || null;
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
         $scope.model.selectedArticle = null;

         $http.jsonp( searchUrl + encodeURIComponent( $scope.resources.search.queryString ) )
            .then( function( response ) {
               var results = ax.object.path( response.data, 'query.search', [] );
               $scope.model.resultCount = ax.object.path( response.data, 'query.searchinfo.totalhits', 0 );
               $scope.model.results = results;

               if( results.length ) {
                  $scope.model.selectedArticle = results[ 0 ];
               }
            } )
            .catch( function( err ) {
               ax.log.error( err );
            } )
            .finally( stateHandler.searchFinished );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function queryDetailsForArticle( article ) {
         return $http.jsonp( extractsUrl + article.title )
            .then( function( response ) {
               var pages = ax.object.path( response.data, 'query.pages', {} );
               var extract = pages[ Object.keys( pages )[ 0 ] ];
               var details = {
                  extract: extract.extract,
                  images: []
               };

               if( extract.pageimage ) {
                  return $http.jsonp( imagesUrl + 'File:' + encodeURIComponent( extract.pageimage ) )
                     .then( function( response ) {
                        var pages = ax.object.path( response.data, 'query.pages', {} );
                        details.images = Object.keys( pages ).map( function( key ) {
                           return pages[ key ].imageinfo[ 0 ].url;
                        } );

                        return details;
                     } );
               }

               return details;
            } )
            .catch( function( err ) {
               ax.log.error( err );
               return {
                  extract: null,
                  images: []
               };
            } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'wikipediaSearchWidget', [] ).controller( 'WikipediaSearchWidgetController', Controller );

} );
