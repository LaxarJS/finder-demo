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
    * API description: http://en.wikipedia.org/w/api.php?action=help&modules=query%2Bsearch
    *
    * Unfortunately it is not possible to get an extract directly via this API. Instead one has to use
    * another url using the url encoded title of the desired article and append it to this url:
    * http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=
    *
    * @type {string}
    */
   var searchUrl = 'http://[languageTag].wikipedia.org/w/api.php?action=query&list=search&continue=&format=json&srsearch=';
   var extractsUrl = 'http://[languageTag].wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=&exlimit=10&pilimit=5&continue=&format=json&titles=';
   var imagesUrl = 'http://[languageTag].wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&continue=&format=json&titles=';
   var externalLinkPrefix = 'http://[languageTag].wikipedia.org/wiki/';

   Controller.$inject = [ '$scope', '$http', '$sce', 'finderDemoUtilities', 'axI18n', 'axLog' ];

   function Controller( $scope, $http, $sce, finderDemoUtils, i18n, log ) {

      $scope.messages = messages;
      $scope.i18n = i18n;

      patterns.i18n.handlerFor( $scope ).registerLocaleFromFeature( 'i18n' );

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

         state: stateHandler.currentState,

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         wikiLink: function( article ) {
            var url = ax.string.format( externalLinkPrefix, { languageTag: $scope.i18n.tags[ 'default' ] } );
            return url + encodeURIComponent( article.title );
         }

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function searchForResults() {
         stateHandler.searchStarted();
         $scope.model.selectedArticle = null;

         var url = ax.string.format( searchUrl, { languageTag: $scope.i18n.tags[ 'default' ] } );
         url = $sce.trustAsResourceUrl( url + encodeURIComponent( $scope.resources.search.queryString ) );
         $http.jsonp( url )
            .then( function( response ) {
               var results = ax.object.path( response.data, 'query.search', [] );
               $scope.model.resultCount = ax.object.path( response.data, 'query.searchinfo.totalhits', 0 );
               $scope.model.results = results;

               if( results.length ) {
                  $scope.model.selectedArticle = results[ 0 ];
               }
            } )
            .catch( function( err ) {
               log.error( err );
            } )
            .finally( stateHandler.searchFinished );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function queryDetailsForArticle( article ) {

         var url = ax.string.format( extractsUrl, { languageTag: $scope.i18n.tags[ 'default' ] } );
         url = $sce.trustAsResourceUrl( url + article.title );
         return $http.jsonp( url )
            .then( function( response ) {
               var pages = ax.object.path( response.data, 'query.pages', {} );
               var extract = pages[ Object.keys( pages )[ 0 ] ];
               var details = {
                  extract: extract.extract,
                  images: []
               };

               if( extract.pageimage ) {
                  var imageUrl = ax.string.format( imagesUrl, { languageTag: $scope.i18n.tags[ 'default' ] } );
                  imageUrl = $sce.trustAsResourceUrl( imageUrl + + 'File:' + encodeURIComponent( extract.pageimage ) );
                  return $http.jsonp( imageUrl )
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
               log.error( err );
               return {
                  extract: null,
                  images: []
               };
            } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'wikipediaSearchWidget', [] )
      .controller( 'WikipediaSearchWidgetController', Controller )
      .config( function( $sceDelegateProvider ) {
         $sceDelegateProvider.resourceUrlWhitelist( [
            // Allow same origin resource loads.
            'self',
            // Allow loading from our assets domain. **.
            'http://en.wikipedia.org/**',
            extractsUrl + '/**',
            imagesUrl + '/**',
            externalLinkPrefix + '/**'
         ] );
      } );
});
