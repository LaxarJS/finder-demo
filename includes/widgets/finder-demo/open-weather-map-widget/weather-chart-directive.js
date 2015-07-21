/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'laxar-uikit',
   './messages',
   'd3',
   'moment',
   'jquery',
   'bootstrap/tooltip'
], function( ng, ax, ui, messages, d3, moment, $ ) {
   'use strict';

   var directiveName = 'openWeatherMapWidgetWeatherChart';
   var directive = [ function() {
      return {
         scope: {
            weatherData: '=' + directiveName,
            iconCodes: '=' + directiveName + 'IconCodes'
         },
         link: function( scope, element ) {

            scope.$watch( 'weatherData', function() {
               if( !scope.weatherData || scope.weatherData.length === 0 ) {
                  element.css( 'display', 'none' );
               }
               else {
                  element.css( 'display', '' );
                  renderChart();
               }
            } );

            // some hardcoded constants
            var timePeriodWidth = 50;
            var borderMargin = 20;
            var innerTopOffset = 100;
            var rainBarWidth = 20;

            //////////////////////////////////////////////////////////////////////////////////////////////////

            var svg = d3.select( element[ 0 ] );
            function renderChart() {
               var languageTag = ui.i18n.languageTagFromScope( scope.$parent );
               var decimalRules = ui.i18n.numberFormatForLanguageTag( languageTag );
               var formatString = ax.i18n.localizer( languageTag ).format;
               var formatDecimal = ui.formatter.create( 'decimal', {
                  decimalSeparator: decimalRules.d,
                  groupingSeparator: decimalRules.g
               } );

               svg.html('');
               var svgHeight = svg.attr( 'height' );
               var contentBoxWidth = scope.weatherData.length * timePeriodWidth;
               var svgWidth = contentBoxWidth + 2 * borderMargin;
               var contentBoxHeight = svgHeight - 2 * borderMargin;

               var weatherData = scope.weatherData.map( function( entry ) {
                  entry.momentDate = moment( entry.dt_txt );
                  entry.shortFormattedTime = entry.momentDate.format( 'HH:mm' );
                  return entry;
               } );

               var days = weatherData.reduce( function( acc, entry, index ) {
                  if( index === 0 || entry.momentDate.hour() === 0 ) {
                     return acc.concat( {
                        x: index * timePeriodWidth + 5,
                        text: entry.momentDate.format( 'ddd' )
                     } );
                  }
                  return acc;
               }, [] );

               function entryX( entry, index ) {
                  return timePeriodWidth / 2 + index * timePeriodWidth;
               }

               svg.attr( 'width', svgWidth );

               var contentBox = svg.append( 'svg:g' )
                  .attr( 'transform', translate( borderMargin, borderMargin ) );

               // Render vertical rulers between two 3-hour periods
               var lineColumnBorder = contentBox.selectAll( 'line.column-border' )
                  // Add a dummy entry to draw the last vertical line
                  .data( weatherData.concat( { momentDate: { hour: function() { return 0; } } } ) );

               lineColumnBorder.enter()
                  .append( 'svg:line' )
                  .attr( 'x1', lineX )
                  .attr( 'x2', lineX )
                  .attr( 'y1', newDaySwitch.bind( null, 0, 50 ) )
                  .attr( 'y2', contentBoxHeight )
                  .attr( 'class', newDaySwitch.bind( null, 'day-column-border column-border', 'column-border' ) );
               lineColumnBorder.exit().remove();

               // Render the day name every time a new day starts
               var groupDayName = contentBox.selectAll( 'g.day-name' ).data( days );
               groupDayName.enter()
                  .append( 'svg:g' )
                  .attr( 'class', 'day-name' )
                  .attr( 'transform', function( day ) {
                     return translate( day.x, 20 );
                  } )
                  .append( 'svg:text' )
                  .text( prop( 'text' ) );
               groupDayName.exit().remove();


               var groupTopData = contentBox.selectAll( 'g.top-data' ).data( weatherData );
               var groupTopDataElement = groupTopData.enter().append( 'svg:g' )
                  .attr( 'class', 'day-time' )
                  .attr( 'transform', function( entry, index ) {
                     return 'translate(' + entryX( entry, index ) + ',50)';
                  } );
               groupTopData.exit().remove();

               groupTopDataElement
                  .append( 'svg:text' )
                  .attr( 'text-anchor', 'middle' )
                  .text( prop( 'shortFormattedTime' ) );
               groupTopDataElement
                  .append( 'svg:text' )
                  .attr( 'class', 'weather-icon' )
                  .attr( 'text-anchor', 'middle' )
                  .attr( 'dy', '1.2em' )
                  .text( function( entry ) {
                     return scope.iconCodes[ entry.weather[ 0 ].icon ];
                  } );
               groupTopDataElement
                  .append( 'svg:text' )
                  .attr( 'class', 'temperature' )
                  .attr( 'dy', '3em' )
                  .text( function( entry ) {
                     return Math.round( entry.main.temp ) + ' °C';
                  } );


               var temperatureLine = ( function() {
                  var temperatureY = d3.scale.linear()
                     .range( [ contentBoxHeight - innerTopOffset, 0 ] )
                     .domain( [
                        d3.min( weatherData, function( entry ) { return entry.main.temp; } ),
                        d3.max( weatherData, function( entry ) { return entry.main.temp; } )
                     ] );

                  return d3.svg.line()
                     .interpolate( 'basis' )
                     .x( entryX )
                     .y( function( entry ) { return temperatureY( entry.main.temp ); } );
               } )();

               var dataBox = contentBox.append( 'svg:g' )
                  .attr( 'class', 'curves' )
                  .attr( 'transform', 'translate(0,' + innerTopOffset + ')' );

               dataBox.selectAll( 'path.temperature-curve' ).remove();
               dataBox.append( 'svg:path' )
                  .attr( 'd', temperatureLine( weatherData ) )
                  .attr( 'class', 'temperature-curve' );

               var rainY = d3.scale.linear()
                  .range( [ contentBoxHeight - innerTopOffset, (contentBoxHeight - innerTopOffset) / 2 ] )
                  .domain( [ 0, d3.max( weatherData, rain ) ] );

               var rectRainBar = dataBox.selectAll( 'rect.rain-bar' ).data( weatherData );
               rectRainBar.enter()
                  .append( 'svg:rect' )
                  .attr( 'class', 'rain-bar' )
                  .attr( 'x', function( entry, index ) {
                     return entryX( entry, index ) - rainBarWidth / 2;
                  } )
                  .attr( 'width', rainBarWidth )
                  .attr( 'y', function( entry ) {
                     return rainY( rain( entry ) );
                  } )
                  .attr( 'height', function( entry ) {
                     return (contentBoxHeight - innerTopOffset) - rainY( rain( entry ) );
                  } )
                  .attr( 'title', function( entry ) {
                     return formatString( messages.RAIN_IN_3_HOURS, {
                        amount: formatDecimal( rain( entry ) )
                     } );
                  } )
                  .call( function( bars ) {
                     bars.forEach( function( bar ) {
                        $( bar ).tooltip( { container: 'body' } );
                     } );
                  } );
               rectRainBar.exit().remove();
            }

            ///////////////////////////////////////////////////// /////////////////////////////////////////////

            function translate( x, y ) {
               return 'translate( ' + x + ' ' + y + ')';
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function newDaySwitch( newDayValue, sameDayValue, entry, index ) {
               return index === 0 || entry.momentDate.hour() === 0 ? newDayValue : sameDayValue;
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function lineX( weatherData, index ) {
               return index * timePeriodWidth;
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function prop( propName ) {
               return function( object ) {
                  return object[ propName ];
               };
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function rain( weatherEntry ) {
               return ax.object.path( weatherEntry, 'rain.3h', 0 );
            }

         }
      };
   } ];

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      name: directiveName,
      factory: directive
   };

} );