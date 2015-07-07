/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns',
   'openlayers',
   './messages',
   'css!ol3/css/ol.css'
], function( ng, ax, patterns, ol, messages ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Uses:
    * - OpenLayers 3 for Map: http://openlayers.org/en/v3.4.0/apidoc/ol.html
    * - nominatim for Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim
    *
    * @type {string}
    */
   var locationSearchUrl = 'http://nominatim.openstreetmap.org/search?format=json&polygon=0&addressdetails=1&q=';

   Controller.$inject = [ '$scope', '$http', 'finderDemoUtilities' ];

   function Controller( $scope, $http, finderDemoUtils ) {

      $scope.messages = messages;

      patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n' );

      $scope.resources = {};
      $scope.model = {
         results: null,
         selectedLocation: null
      };

      patterns.resources.handlerFor( $scope )
         .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );

      var stateHandler =
         finderDemoUtils.stateWatcherFor( $scope, 'model.selectedLocation', 'resources.search.queryString' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.functions = {

         state: stateHandler.currentState

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function searchForResults() {
         stateHandler.searchStarted();
         $scope.model.selectedLocation = null;

         $http.get( locationSearchUrl + encodeURIComponent( $scope.resources.search.queryString ) )
            .then( function( response ) {
               var results = response.data;
               $scope.model.results = results;

               if( results && results.length > 0 ) {
                  $scope.model.selectedLocation = results[ 0 ];
               }
            }, function( err ) {
               ax.log.error( err );
            } )
            .finally( stateHandler.searchFinished );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var directiveName = 'openStreetMapWidgetMap';

   return ng.module( 'openStreetMapWidget', [] )
      .controller( 'OpenStreetMapWidgetController', Controller )
      .directive( directiveName, [ function() {
         return {
            scope: {
               latLon: '=' + directiveName
            },
            link: function( scope, element ) {

               var view = new ol.View( {
                  center:  ol.proj.transform( [ 6.0838618, 50.776351 ], 'EPSG:4326', 'EPSG:3857' ),
                  zoom: 13
               } );

               var map = new ol.Map( {
                  target: element[ 0 ],
                  layers: [
                     new ol.layer.Tile( {
                        source: new ol.source.MapQuest( { layer: 'osm' } )
                     } )
                  ],
                  view: view
               } );

               scope.$watch( 'latLon', function( latLon ) {
                  if( latLon && latLon.lat && latLon.lon ) {
                     view.setCenter( ol.proj.transform( [
                        parseFloat( latLon.lon ),
                        parseFloat( latLon.lat )
                     ], 'EPSG:4326', 'EPSG:3857' ) );
                     view.setZoom( 13 );
                  }
               }, true );

            }
         };
      } ] );

} );
