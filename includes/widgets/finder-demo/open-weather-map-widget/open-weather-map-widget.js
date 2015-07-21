/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'require',
   'angular',
   'laxar',
   'laxar-patterns',
   'moment',
   './messages',
   './weather-chart-directive',
   './scroll-area-directive'
], function( require, ng, ax, patterns, moment, messages, weatherChartDirective, scrollAreaDirective ) {
   'use strict';

   /**
    * Without feature locations:
    *
    * Uses nominatim for Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim
    *
    * @type {string}
    */
   var locationSearchUrl = 'http://nominatim.openstreetmap.org/search?format=json&polygon=0&addressdetails=1&q=';
   var currentWeatherUrlTemplate =
      'http://api.openweathermap.org/data/2.5/weather?lat=[lat]&lon=[lon]&units=metric&lang=[lang]&callback=JSON_CALLBACK';
   var forecastWeatherUrlTemplate =
      'http://api.openweathermap.org/data/2.5/forecast?lat=[lat]&lon=[lon]&units=metric&lang=[lang]&callback=JSON_CALLBACK';

   Controller.$inject = [ '$scope', '$http', '$q', 'finderDemoUtilities' ];

   function Controller( $scope, $http, $q, finderDemoUtils ) {

      $scope.messages = messages;

      patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n', {
         onChange: function( i18n ) {
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

      // NEEDS FIX A: Only for instant result displaying during development
      //$q.when().then( function() { $scope.model.selectedLocation = 'Aachen'; } );

      if( $scope.features.locations.resource ) {
         patterns.resources.handlerFor( $scope )
            .registerResourceFromFeature( 'search' )
            .registerResourceFromFeature( 'locations', { onUpdateReplace: selectLocation } );

         if( $scope.features.locations.searchingOn ) {
            patterns.flags.handlerFor( $scope )
               .registerFlagFromFeature( 'locations.searchingOn', {
                  onChange: function( searching ) {
                     stateHandler[ searching ? 'searchStarted' : 'searchFinished' ]();
                  }
               } );
         }
      }
      else {
         patterns.resources.handlerFor( $scope )
            .registerResourceFromFeature( 'search', { onUpdateReplace: searchForResults } );
      }

      var stateHandler =
         finderDemoUtils.stateWatcherFor( $scope, 'model.selectedLocation', 'resources.search.queryString' );

      $scope.$watch( 'model.selectedLocation', updateCurrentWeather );
      $scope.$watch( 'model.selectedLocation', updateForecastWeather );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.functions = {

         state: stateHandler.currentState,

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function searchForResults() {
         stateHandler.searchStarted();
         $scope.model.selectedLocation = null;

         $http.get( locationSearchUrl + encodeURIComponent( $scope.resources.search.queryString ) )
            .then( function( response ) {
               $scope.resources.locations = response.data;
               selectLocation();
            }, function( err ) {
               ax.log.error( err );
            } )
            .then( stateHandler.searchFinished );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function selectLocation() {
         $scope.model.selectedLocation = null;
         var locations = $scope.resources.locations;
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

         var url = ax.string.format( currentWeatherUrlTemplate, {
            lat: $scope.model.selectedLocation.lat,
            lon: $scope.model.selectedLocation.lon,
            lang: activeLanguageTag()
         } );

         // NEEDS FIX A: dummy data to
         //$q.when( { data: dummyData } )
         //   .then( function( response ) {
         //      $scope.model.currentWeather = response.data;
         //   } );

         $http.jsonp( url )
            .then( function( response ) {
               $scope.model.currentWeather = response.data;
               //console.log( JSON.stringify( response.data, null, 3 ).replace( /"/g, '\'' ) );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function updateForecastWeather() {
         $scope.model.forecastWeather = null;
         if( !$scope.model.selectedLocation ) {
            return;
         }

         var url = ax.string.format( forecastWeatherUrlTemplate, {
            lat: $scope.model.selectedLocation.lat,
            lon: $scope.model.selectedLocation.lon,
            lang: activeLanguageTag()
         } );

         // NEEDS FIX A: dummy data to
         //$q.when( { data: dummyDataForecast } )
         //   .then( function( response ) {
         //      $scope.model.forecastWeather = response.data;
         //   } );
         $http.jsonp( url )
            .then( function( response ) {
               $scope.model.forecastWeather = response.data;
               //console.log( JSON.stringify( response.data, null, 3 ).replace( /"/g, '\'' ) );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function loadMomentLocale( locale ) {
         var momentLocaleName = locale.replace( '_', '-' );
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
         return ax.i18n.languageTagFromI18n( $scope.i18n, 'en' );
      }

   }

   // d suffix is for daytime icons, n suffix for nighttime icons
   var iconCodesToLetters = {
      '01d': 'B', '01n': 'C', // clear sky,
      '02d': 'H', '02n': 'I', // few clouds
      '03d': 'N', '03n': '5', // scatterred clouds
      '04d': 'Y', '04n': '%', // broken clouds
      '09d': 'Q', '09n': '7', // shower rain
      '10d': 'R', '10n': '8', // rain
      '11d': 'P', '11n': '6', // thunderstorm
      '13d': 'W', '13n': '#', // snow
      '50d': 'M', '50n': 'M', // mist
   };

   var dummyData = {
      'coord': {
         'lon': 11,
         'lat': 46.97
      },
      'weather': [
         {
            'id': 801,
            'main': 'Clouds',
            'description': 'few clouds',
            'icon': '02d'
         }
      ],
      'base': 'stations',
      'main': {
         'temp': 28.16,
         'pressure': 1014,
         'humidity': 37,
         'temp_min': 27,
         'temp_max': 30
      },
      'visibility': 10000,
      'wind': {
         'speed': 3.1,
         'deg': 70
      },
      'clouds': {
         'all': 20
      },
      'dt': 1437400200,
      'sys': {
         'type': 1,
         'id': 5930,
         'message': 0.0112,
         'country': 'AT',
         'sunrise': 1437363695,
         'sunset': 1437418951
      },
      'id': 2764957,
      'name': 'Soelden',
      'cod': 200
   };

   var dummyDataForecast = {
      'city': {
         'id': 2764957,
         'name': 'Soelden',
         'coord': {
            'lon': 11,
            'lat': 46.966671
         },
         'country': 'AT',
         'population': 0,
         'sys': {
            'population': 0
         }
      },
      'cod': '200',
      'message': 0.0122,
      'cnt': 35,
      'list': [
         {
            'dt': 1437404400,
            'main': {
               'temp': 25.98,
               'temp_min': 15.96,
               'temp_max': 25.98,
               'pressure': 802.4,
               'sea_level': 1027.74,
               'grnd_level': 802.4,
               'humidity': 46,
               'temp_kf': 10.02
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01d'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.05,
               'deg': 231
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-20 15:00:00'
         },
         {
            'dt': 1437415200,
            'main': {
               'temp': 21.12,
               'temp_min': 13.6,
               'temp_max': 21.12,
               'pressure': 802.77,
               'sea_level': 1028.47,
               'grnd_level': 802.77,
               'humidity': 47,
               'temp_kf': 7.52
            },
            'weather': [
               {
                  'id': 802,
                  'main': 'Clouds',
                  'description': 'scattered clouds',
                  'icon': '03d'
               }
            ],
            'clouds': {
               'all': 32
            },
            'wind': {
               'speed': 0.21,
               'deg': 271.504
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-20 18:00:00'
         },
         {
            'dt': 1437426000,
            'main': {
               'temp': 15.26,
               'temp_min': 10.25,
               'temp_max': 15.26,
               'pressure': 804.13,
               'sea_level': 1030.62,
               'grnd_level': 804.13,
               'humidity': 65,
               'temp_kf': 5.01
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01n'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.07,
               'deg': 247.001
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-20 21:00:00'
         },
         {
            'dt': 1437436800,
            'main': {
               'temp': 10.39,
               'temp_min': 7.88,
               'temp_max': 10.39,
               'pressure': 804.53,
               'sea_level': 1031.53,
               'grnd_level': 804.53,
               'humidity': 78,
               'temp_kf': 2.51
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01n'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.43,
               'deg': 242.5
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-21 00:00:00'
         },
         {
            'dt': 1437447600,
            'main': {
               'temp': 6.2,
               'temp_min': 6.2,
               'temp_max': 6.2,
               'pressure': 804.24,
               'sea_level': 1031.67,
               'grnd_level': 804.24,
               'humidity': 84,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01n'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.56,
               'deg': 261.001
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-21 03:00:00'
         },
         {
            'dt': 1437458400,
            'main': {
               'temp': 8.2,
               'temp_min': 8.2,
               'temp_max': 8.2,
               'pressure': 804.56,
               'sea_level': 1031.81,
               'grnd_level': 804.56,
               'humidity': 78,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01d'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.51,
               'deg': 270.001
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-21 06:00:00'
         },
         {
            'dt': 1437469200,
            'main': {
               'temp': 15.21,
               'temp_min': 15.21,
               'temp_max': 15.21,
               'pressure': 804.83,
               'sea_level': 1030.75,
               'grnd_level': 804.83,
               'humidity': 55,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01d'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.59,
               'deg': 245.001
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-21 09:00:00'
         },
         {
            'dt': 1437480000,
            'main': {
               'temp': 17.49,
               'temp_min': 17.49,
               'temp_max': 17.49,
               'pressure': 804.53,
               'sea_level': 1029.71,
               'grnd_level': 804.53,
               'humidity': 49,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 802,
                  'main': 'Clouds',
                  'description': 'scattered clouds',
                  'icon': '03d'
               }
            ],
            'clouds': {
               'all': 36
            },
            'wind': {
               'speed': 0.66,
               'deg': 242.002
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-21 12:00:00'
         },
         {
            'dt': 1437490800,
            'main': {
               'temp': 16.61,
               'temp_min': 16.61,
               'temp_max': 16.61,
               'pressure': 804.22,
               'sea_level': 1029.51,
               'grnd_level': 804.22,
               'humidity': 48,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 803,
                  'main': 'Clouds',
                  'description': 'broken clouds',
                  'icon': '04d'
               }
            ],
            'clouds': {
               'all': 80
            },
            'wind': {
               'speed': 0.12,
               'deg': 224.501
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-21 15:00:00'
         },
         {
            'dt': 1437501600,
            'main': {
               'temp': 12.83,
               'temp_min': 12.83,
               'temp_max': 12.83,
               'pressure': 804.85,
               'sea_level': 1030.37,
               'grnd_level': 804.85,
               'humidity': 63,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 88
            },
            'wind': {
               'speed': 0.26,
               'deg': 257.502
            },
            'rain': {
               '3h': 0.27
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-21 18:00:00'
         },
         {
            'dt': 1437512400,
            'main': {
               'temp': 9.77,
               'temp_min': 9.77,
               'temp_max': 9.77,
               'pressure': 805.46,
               'sea_level': 1031.65,
               'grnd_level': 805.46,
               'humidity': 76,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10n'
               }
            ],
            'clouds': {
               'all': 12
            },
            'wind': {
               'speed': 0.31,
               'deg': 292
            },
            'rain': {
               '3h': 0.49
            },
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-21 21:00:00'
         },
         {
            'dt': 1437523200,
            'main': {
               'temp': 8.16,
               'temp_min': 8.16,
               'temp_max': 8.16,
               'pressure': 805.18,
               'sea_level': 1031.88,
               'grnd_level': 805.18,
               'humidity': 83,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01n'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.62,
               'deg': 246.503
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-22 00:00:00'
         },
         {
            'dt': 1437534000,
            'main': {
               'temp': 6.85,
               'temp_min': 6.85,
               'temp_max': 6.85,
               'pressure': 804.82,
               'sea_level': 1031.93,
               'grnd_level': 804.82,
               'humidity': 86,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01n'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.55,
               'deg': 261.5
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-22 03:00:00'
         },
         {
            'dt': 1437544800,
            'main': {
               'temp': 8.83,
               'temp_min': 8.83,
               'temp_max': 8.83,
               'pressure': 804.57,
               'sea_level': 1031.69,
               'grnd_level': 804.57,
               'humidity': 81,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01d'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.47,
               'deg': 249.502
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-22 06:00:00'
         },
         {
            'dt': 1437555600,
            'main': {
               'temp': 15.13,
               'temp_min': 15.13,
               'temp_max': 15.13,
               'pressure': 804.74,
               'sea_level': 1030.41,
               'grnd_level': 804.74,
               'humidity': 60,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.16,
               'deg': 267.002
            },
            'rain': {
               '3h': 0.08
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-22 09:00:00'
         },
         {
            'dt': 1437566400,
            'main': {
               'temp': 12.84,
               'temp_min': 12.84,
               'temp_max': 12.84,
               'pressure': 804.01,
               'sea_level': 1029.4,
               'grnd_level': 804.01,
               'humidity': 98,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 8
            },
            'wind': {
               'speed': 0.61,
               'deg': 264.502
            },
            'rain': {
               '3h': 2.4
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-22 12:00:00'
         },
         {
            'dt': 1437577200,
            'main': {
               'temp': 11.91,
               'temp_min': 11.91,
               'temp_max': 11.91,
               'pressure': 803.64,
               'sea_level': 1029.36,
               'grnd_level': 803.64,
               'humidity': 94,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 32
            },
            'wind': {
               'speed': 0.32,
               'deg': 270.001
            },
            'rain': {
               '3h': 1.36
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-22 15:00:00'
         },
         {
            'dt': 1437588000,
            'main': {
               'temp': 9.62,
               'temp_min': 9.62,
               'temp_max': 9.62,
               'pressure': 803.53,
               'sea_level': 1029.12,
               'grnd_level': 803.53,
               'humidity': 96,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 36
            },
            'wind': {
               'speed': 0.16,
               'deg': 234.001
            },
            'rain': {
               '3h': 1.95
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-22 18:00:00'
         },
         {
            'dt': 1437598800,
            'main': {
               'temp': 7.42,
               'temp_min': 7.42,
               'temp_max': 7.42,
               'pressure': 803.46,
               'sea_level': 1029.87,
               'grnd_level': 803.46,
               'humidity': 100,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 800,
                  'main': 'Clear',
                  'description': 'clear sky',
                  'icon': '01n'
               }
            ],
            'clouds': {
               'all': 0
            },
            'wind': {
               'speed': 0.41,
               'deg': 237.002
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-22 21:00:00'
         },
         {
            'dt': 1437609600,
            'main': {
               'temp': 6.26,
               'temp_min': 6.26,
               'temp_max': 6.26,
               'pressure': 802.4,
               'sea_level': 1029.19,
               'grnd_level': 802.4,
               'humidity': 99,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 801,
                  'main': 'Clouds',
                  'description': 'few clouds',
                  'icon': '02n'
               }
            ],
            'clouds': {
               'all': 24
            },
            'wind': {
               'speed': 0.41,
               'deg': 247.014
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-23 00:00:00'
         },
         {
            'dt': 1437620400,
            'main': {
               'temp': 5.58,
               'temp_min': 5.58,
               'temp_max': 5.58,
               'pressure': 801.53,
               'sea_level': 1028.64,
               'grnd_level': 801.53,
               'humidity': 100,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10n'
               }
            ],
            'clouds': {
               'all': 32
            },
            'wind': {
               'speed': 0.42,
               'deg': 251.006
            },
            'rain': {
               '3h': 0.02
            },
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-23 03:00:00'
         },
         {
            'dt': 1437631200,
            'main': {
               'temp': 6.57,
               'temp_min': 6.57,
               'temp_max': 6.57,
               'pressure': 801.4,
               'sea_level': 1028.23,
               'grnd_level': 801.4,
               'humidity': 97,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 12
            },
            'wind': {
               'speed': 0.36,
               'deg': 259.001
            },
            'rain': {
               '3h': 0.01
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-23 06:00:00'
         },
         {
            'dt': 1437642000,
            'main': {
               'temp': 13.59,
               'temp_min': 13.59,
               'temp_max': 13.59,
               'pressure': 800.95,
               'sea_level': 1026.47,
               'grnd_level': 800.95,
               'humidity': 69,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 801,
                  'main': 'Clouds',
                  'description': 'few clouds',
                  'icon': '02d'
               }
            ],
            'clouds': {
               'all': 12
            },
            'wind': {
               'speed': 0.46,
               'deg': 190.004
            },
            'rain': {},
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-23 09:00:00'
         },
         {
            'dt': 1437652800,
            'main': {
               'temp': 12.66,
               'temp_min': 12.66,
               'temp_max': 12.66,
               'pressure': 800.29,
               'sea_level': 1025.39,
               'grnd_level': 800.29,
               'humidity': 86,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 20
            },
            'wind': {
               'speed': 0.05,
               'deg': 215.002
            },
            'rain': {
               '3h': 1.48
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-23 12:00:00'
         },
         {
            'dt': 1437663600,
            'main': {
               'temp': 12.89,
               'temp_min': 12.89,
               'temp_max': 12.89,
               'pressure': 799.89,
               'sea_level': 1025.25,
               'grnd_level': 799.89,
               'humidity': 79,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 36
            },
            'wind': {
               'speed': 0.06,
               'deg': 256.002
            },
            'rain': {
               '3h': 1.19
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-23 15:00:00'
         },
         {
            'dt': 1437674400,
            'main': {
               'temp': 8.45,
               'temp_min': 8.45,
               'temp_max': 8.45,
               'pressure': 800.25,
               'sea_level': 1025.84,
               'grnd_level': 800.25,
               'humidity': 98,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 44
            },
            'wind': {
               'speed': 0.12,
               'deg': 70.0008
            },
            'rain': {
               '3h': 1.5
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-23 18:00:00'
         },
         {
            'dt': 1437685200,
            'main': {
               'temp': 7.43,
               'temp_min': 7.43,
               'temp_max': 7.43,
               'pressure': 800.33,
               'sea_level': 1026.73,
               'grnd_level': 800.33,
               'humidity': 97,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 803,
                  'main': 'Clouds',
                  'description': 'broken clouds',
                  'icon': '04n'
               }
            ],
            'clouds': {
               'all': 56
            },
            'wind': {
               'speed': 0.56,
               'deg': 263.51
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-23 21:00:00'
         },
         {
            'dt': 1437696000,
            'main': {
               'temp': 6.41,
               'temp_min': 6.41,
               'temp_max': 6.41,
               'pressure': 799.84,
               'sea_level': 1026.78,
               'grnd_level': 799.84,
               'humidity': 98,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 802,
                  'main': 'Clouds',
                  'description': 'scattered clouds',
                  'icon': '03n'
               }
            ],
            'clouds': {
               'all': 32
            },
            'wind': {
               'speed': 0.5,
               'deg': 281.502
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-24 00:00:00'
         },
         {
            'dt': 1437706800,
            'main': {
               'temp': 5.4,
               'temp_min': 5.4,
               'temp_max': 5.4,
               'pressure': 799.55,
               'sea_level': 1026.99,
               'grnd_level': 799.55,
               'humidity': 99,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 802,
                  'main': 'Clouds',
                  'description': 'scattered clouds',
                  'icon': '03n'
               }
            ],
            'clouds': {
               'all': 44
            },
            'wind': {
               'speed': 0.66,
               'deg': 308.002
            },
            'rain': {},
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-24 03:00:00'
         },
         {
            'dt': 1437717600,
            'main': {
               'temp': 6.75,
               'temp_min': 6.75,
               'temp_max': 6.75,
               'pressure': 799.88,
               'sea_level': 1027.33,
               'grnd_level': 799.88,
               'humidity': 95,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 64
            },
            'wind': {
               'speed': 0.52,
               'deg': 287.005
            },
            'rain': {
               '3h': 0.03
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-24 06:00:00'
         },
         {
            'dt': 1437728400,
            'main': {
               'temp': 11.46,
               'temp_min': 11.46,
               'temp_max': 11.46,
               'pressure': 800.22,
               'sea_level': 1026.61,
               'grnd_level': 800.22,
               'humidity': 77,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 36
            },
            'wind': {
               'speed': 0.41,
               'deg': 9.00684
            },
            'rain': {
               '3h': 0.0275
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-24 09:00:00'
         },
         {
            'dt': 1437739200,
            'main': {
               'temp': 10.52,
               'temp_min': 10.52,
               'temp_max': 10.52,
               'pressure': 799.77,
               'sea_level': 1025.48,
               'grnd_level': 799.77,
               'humidity': 98,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 44
            },
            'wind': {
               'speed': 0.41,
               'deg': 230.002
            },
            'rain': {
               '3h': 1.1875
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-24 12:00:00'
         },
         {
            'dt': 1437750000,
            'main': {
               'temp': 10.8,
               'temp_min': 10.8,
               'temp_max': 10.8,
               'pressure': 799.25,
               'sea_level': 1025.04,
               'grnd_level': 799.25,
               'humidity': 88,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 48
            },
            'wind': {
               'speed': 0.31,
               'deg': 127.5
            },
            'rain': {
               '3h': 0.8625
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-24 15:00:00'
         },
         {
            'dt': 1437760800,
            'main': {
               'temp': 8.74,
               'temp_min': 8.74,
               'temp_max': 8.74,
               'pressure': 799.33,
               'sea_level': 1025.13,
               'grnd_level': 799.33,
               'humidity': 94,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10d'
               }
            ],
            'clouds': {
               'all': 32
            },
            'wind': {
               'speed': 0.31,
               'deg': 144.501
            },
            'rain': {
               '3h': 1.125
            },
            'sys': {
               'pod': 'd'
            },
            'dt_txt': '2015-07-24 18:00:00'
         },
         {
            'dt': 1437771600,
            'main': {
               'temp': 7.04,
               'temp_min': 7.04,
               'temp_max': 7.04,
               'pressure': 799.45,
               'sea_level': 1026.32,
               'grnd_level': 799.45,
               'humidity': 100,
               'temp_kf': 0
            },
            'weather': [
               {
                  'id': 500,
                  'main': 'Rain',
                  'description': 'light rain',
                  'icon': '10n'
               }
            ],
            'clouds': {
               'all': 76
            },
            'wind': {
               'speed': 0.12,
               'deg': 161.003
            },
            'rain': {
               '3h': 0.0125
            },
            'sys': {
               'pod': 'n'
            },
            'dt_txt': '2015-07-24 21:00:00'
         }
      ]
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'openWeatherMapWidget', [] )
      .controller( 'OpenWeatherMapWidgetController', Controller )
      .directive( weatherChartDirective.name, weatherChartDirective.factory )
      .directive( scrollAreaDirective.name, scrollAreaDirective.factory );

} );
