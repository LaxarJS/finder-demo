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

            scope.$watch( 'weatherData', function( weatherData ) {
               if( !weatherData || weatherData.length === 0 ) {
                  return;
               }

               renderChart( weatherData.map( function( entry ) {
                  var clone = ax.object.deepClone( entry );
                  clone.momentDate = moment( clone.dt_txt );
                  clone.shortFormattedTime = clone.momentDate.format( 'HH:mm' );
                  return clone;
               } ) );
            } );

            var languageTag = ui.i18n.languageTagFromScope( scope.$parent );
            var decimalRules = ui.i18n.numberFormatForLanguageTag( languageTag );
            var formatString = ax.i18n.localizer( languageTag ).format;
            var formatDecimal = ui.formatter.create( 'decimal', {
               decimalSeparator: decimalRules.d,
               groupingSeparator: decimalRules.g
            } );

            // some hardcoded constants
            var timePeriodWidth = 50;
            var borderMargin = 20;
            var innerTopOffset = 100;
            var rainBarWidth = 20;

            var svg = d3.select( element[ 0 ] );
            var svgHeight = svg.attr( 'height' );
            var contentBoxHeight = svgHeight - 2 * borderMargin;
            var contentBoxWidth;
            var svgWidth;

            // A group to add some margins for the complete chart contents
            var contentBox = svg.append( 'svg:g' )
               .attr( 'transform', translate( borderMargin, borderMargin ) );

            // The box where all curves and bars are rendered
            var dataBox = contentBox.append( 'svg:g' )
               .attr( 'class', 'curves' )
               .attr( 'transform', 'translate(0,' + innerTopOffset + ')' );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function renderChart( weatherData ) {

               contentBoxWidth = weatherData.length * timePeriodWidth;
               svgWidth = contentBoxWidth + 2 * borderMargin;

               var days = weatherData.reduce( function( acc, entry, index ) {
                  if( index === 0 || entry.momentDate.hour() === 0 ) {
                     return acc.concat( {
                        x: index * timePeriodWidth + 5,
                        text: entry.momentDate.format( 'ddd' )
                     } );
                  }
                  return acc;
               }, [] );

               svg.attr( 'width', svgWidth );

               // Render vertical rulers between two 3-hour periods
               var lineColumnBorder = contentBox.selectAll( 'line.column-border' )
                  // Add a dummy entry to draw the last vertical line
                  .data( weatherData.concat( { momentDate: { hour: function() { return 0; } } } ) );

               lineColumnBorder.enter().append( 'svg:line' )
                  .attr( 'x1', lineX )
                  .attr( 'x2', lineX )
                  .attr( 'y1', newDaySwitch.bind( null, 0, 50 ) )
                  .attr( 'y2', contentBoxHeight )
                  .attr( 'class', newDaySwitch.bind( null, 'day-column-border column-border', 'column-border' ) );
               lineColumnBorder.exit().remove();

               // Render the day name every time a new day starts
               var groupDayName = contentBox.selectAll( 'g.day-name' ).data( days );
               groupDayName.enter().append( 'svg:g' )
                  .attr( 'class', 'day-name' )
                  .attr( 'transform', function( day ) {
                     return translate( day.x, 20 );
                  } )
                  .append( 'svg:text' )
                  .text( propertyAccessor( 'text' ) );
               groupDayName.exit().remove();

               renderColumnHeaders( weatherData );

               renderTemperatureLine( weatherData );

               renderRainBarChart( weatherData );
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function renderColumnHeaders( weatherData ) {
               // UPDATE
               contentBox.selectAll( 'g.top-data' )
                  .transition()
                  .duration( 250 )
                  .style( 'opacity', 0 )
                  .transition()
                  .call( function() {
                     contentBox.selectAll( 'g.top-data' ).data( weatherData );
                  } )
                  .each( 'end', function( entry ) {
                     var groupTopData = d3.select( this );
                     groupTopData.select( 'text.day-time' )
                        .text( propertyAccessor( 'shortFormattedTime' ) );
                     groupTopData.select( 'text.weather-icon' )
                        .text( scope.iconCodes[ entry.weather[ 0 ].icon ] );
                     groupTopData.select( 'text.temperature' )
                        .text( Math.round( entry.main.temp ) + ' °C' );
                  } )
                  .transition()
                  .duration( 250 )
                  .style( 'opacity', 1 );

               // ENTER
               var groupTopData = contentBox.selectAll( 'g.top-data' ).data( weatherData );
               var groupTopDataElement = groupTopData.enter().append( 'svg:g' )
                  .attr( 'class', 'top-data' )
                  .attr( 'transform', function( entry, index ) {
                     return 'translate(' + entryX( entry, index ) + ',50)';
                  } );

               groupTopDataElement
                  .append( 'svg:text' )
                  .attr( 'class', 'day-time' )
                  .attr( 'text-anchor', 'middle' )
                  .text( propertyAccessor( 'shortFormattedTime' ) );
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

               // EXIT
               groupTopData.exit().remove();
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function renderTemperatureLine( weatherData ) {
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

               var temperaturePath = dataBox.selectAll( 'path.temperature-curve' ).data( [ weatherData ] );

               // UPDATE
               temperaturePath
                  .transition()
                  .duration( 500 )
                  .attr( 'd', temperatureLine );

               // ENTER
               temperaturePath.enter().append( 'svg:path' )
                  .attr( 'class', 'temperature-curve' )
                  .attr( 'd', temperatureLine );

               // EXIT
               temperaturePath.exit().remove();
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function renderRainBarChart( weatherData ) {
               var rain = propertyAccessor( 'rain.3h', 0 );
               var rainY = d3.scale.linear()
                  .range( [ contentBoxHeight - innerTopOffset, (contentBoxHeight - innerTopOffset) / 2 ] )
                  .domain( [ 0, d3.max( weatherData, rain ) ] );

               var rectRainBar = dataBox.selectAll( 'rect.rain-bar' ).data( weatherData );

               // UPDATE
               rectRainBar
                  .transition()
                  .duration( 500 )
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
                  } );

               // ENTER
               rectRainBar.enter().append( 'svg:rect' )
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

               // EXIT
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

            function entryX( entry, index ) {
               return timePeriodWidth / 2 + index * timePeriodWidth;
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function lineX( weatherData, index ) {
               return index * timePeriodWidth;
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function propertyAccessor( propName, fallback ) {
               return function( object ) {
                  return ax.object.path( object, propName, fallback );
               };
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