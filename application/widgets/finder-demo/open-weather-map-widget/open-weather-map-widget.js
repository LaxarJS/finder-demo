/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */

//import * as require from 'require';
import * as ng from 'angular';
import * as moment from 'moment';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';
import { messages } from './messages';
import { iconCodesToLetters, dummyData, dummyDataForecast } from './data';
import { weatherChartDirective } from './weather-chart-directive';
import { scrollAreaDirective } from './scroll-area-directive';

/**
 * Without feature locations:
 *
 * Uses nominatim for Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim
 *
 * @type {string}
 */
const locationSearchUrl = 'http://nominatim.openstreetmap.org/search' +
                          '?format=json&polygon=0&addressdetails=1&q=';
const currentWeatherUrlTemplate = 'http://api.openweathermap.org/data/2.5/weather' +
                                  '?lat=[lat]&lon=[lon]&units=metric&lang=[lang]';
const forecastWeatherUrlTemplate = 'http://api.openweathermap.org/data/2.5/forecast' +
                                   '?lat=[lat]&lon=[lon]&units=metric&lang=[lang]';

Controller.$inject = [ '$scope', '$http', '$q', '$sce', 'finderDemoUtilities', 'axI18n', 'axLog' ];

function Controller( $scope, $http, $q, $sce, finderDemoUtils, i18n, log ) {

   $scope.messages = messages;
   $scope.i18n = i18n;

   patterns.i18n.handlerFor( $scope ).registerLocaleFromFeature( 'i18n', {
      onChange( i18n ) {
         loadMomentLocale( i18n.languageTag );
      }
   } );

   $scope.resources = {};
   $scope.model = {
      results: null,
      selectedLocation: null,
      currentWeather: null,
      forecastWeather: null,
      forecastWeatherStructured: null
   };
   $scope.iconCodesToLetters = iconCodesToLetters;

   const stateHandler = finderDemoUtils.stateWatcherFor(
      $scope, 'model.selectedLocation', 'resources.search.queryString' );


   // NEEDS FIX A: Only for instant result displaying during development
   // $q.when().then( function() { $scope.model.selectedLocation = 'Aachen'; } );

   if( $scope.features.locations.resource ) {
      patterns.resources.handlerFor( $scope )
         .registerResourceFromFeature( 'search' )
         .registerResourceFromFeature( 'locations', { onUpdateReplace: selectLocation } );

      if( $scope.features.locations.searchingOn ) {
         patterns.flags.handlerFor( $scope )
            .registerFlagFromFeature( 'locations.searchingOn', {
               onChange( searching ) {
                  stateHandler[ searching ? 'searchStarted' : 'searchFinished' ]();
               }
            } );
      }
   }
   else {
      patterns.resources.handlerFor( $scope )
         .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );
   }

   $scope.$watch( 'model.selectedLocation', updateCurrentWeather );
   $scope.$watch( 'model.selectedLocation', updateForecastWeather );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.functions = {

      state: stateHandler.currentState

   };

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function searchForResults() {
      stateHandler.searchStarted();
      $scope.model.selectedLocation = null;

      const url = $sce.trustAsResourceUrl(
         locationSearchUrl + encodeURIComponent( $scope.resources.search.queryString ) );
      $http.get( url )
         .then( response => {
            $scope.resources.locations = response.data;
            selectLocation();
         }, err => {
            log.error( err );
         } )
         .then( stateHandler.searchFinished );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function selectLocation() {
      $scope.model.selectedLocation = null;
      const locations = $scope.resources.locations;
      if( locations && locations.length > 0 ) {
         $scope.model.selectedLocation = locations[ 0 ];
      }
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function updateCurrentWeather() {
      $scope.model.currentWeather = null;
      if( !$scope.model.selectedLocation ) {
         return;
      }

      const url = $sce.trustAsResourceUrl( ax.string.format( currentWeatherUrlTemplate, {
         lat: $scope.model.selectedLocation.lat,
         lon: $scope.model.selectedLocation.lon,
         lang: activeLanguageTag()
      } ) );

      // NEEDS FIX A: dummy data to
      //$q.when( { data: dummyData } )
      //   .then( function( response ) {
      //      $scope.model.currentWeather = response.data;
      //   } );
      $http.jsonp( url )
         .then( response => {
            $scope.model.currentWeather = response.data;
            //console.log( JSON.stringify( response.data, null, 3 ).replace( /"/g, '\'' ) );
         }, err => {
            log.error( err );
      } );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function updateForecastWeather() {
      $scope.model.forecastWeather = null;
      if( !$scope.model.selectedLocation ) {
         return;
      }

      const url = $sce.trustAsResourceUrl( ax.string.format( forecastWeatherUrlTemplate, {
         lat: $scope.model.selectedLocation.lat,
         lon: $scope.model.selectedLocation.lon,
         lang: activeLanguageTag()
      } ) );

      // NEEDS FIX A: dummy data to
      //$q.when( { data: dummyDataForecast } )
      //   .then( function( response ) {
      //      $scope.model.forecastWeather = response.data;
      //   } );
      $http.jsonp( url )
         .then( response => {
            $scope.model.forecastWeather = response.data;
            //console.log( JSON.stringify( response.data, null, 3 ).replace( /"/g, '\'' ) );
         } );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function loadMomentLocale( locale ) {
      const momentLocaleName = locale.replace( '_', '-' );
      if( !locale || locale === 'en' ) {
         moment.locale( 'en' );
         return;
      }

      require( [ 'moment/locale/' + momentLocaleName ], function() {
         moment.locale( momentLocaleName );
      }, function() {
         loadMomentLocale( momentLocaleName.split( '-' ).slice( 0, -1 ).join( '-' ) );
      } );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function activeLanguageTag() {
      return i18n.languageTag() || 'en';
   }

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'openWeatherMapWidget', [] )
      .controller( 'OpenWeatherMapWidgetController', Controller )
      .directive( weatherChartDirective.name, weatherChartDirective.factory )
      .directive( scrollAreaDirective.name, scrollAreaDirective.factory ).name;


