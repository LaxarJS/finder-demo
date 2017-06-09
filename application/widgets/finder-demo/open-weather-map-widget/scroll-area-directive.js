/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as ng from 'angular';

var isTouchDevive = 'ontouchstart' in window || 'onmsgesturechange' in window;
var events = {
   start: isTouchDevive ? 'touchstart' : 'mousedown',
   move: isTouchDevive ? 'touchmove' : 'mousemove',
   stop: isTouchDevive ? 'touchend' : 'mouseup'
};

const directiveName = 'openWeatherMapWidgetScrollArea';
const directive = [ function() {
   return {
      link: function( scope, element ) {
         element.on( 'selectstart', function( event ) {
            event.preventDefault();
            event.stopPropagation();
         } );

         var svg = ng.element( element[ 0 ].querySelector( 'svg' ) );
         svg.on( events.start, function( mdEvent ) {
            mdEvent.preventDefault();

            var doc = ng.element( document );
            var xStart = mdEvent.pageX;
            var left = element.prop( 'scrollLeft' );
            var maxScroll = element.prop( 'scrollWidth' ) - element[ 0 ].clientWidth;

            doc.on( events.move, function( mmEvent ) {
               mmEvent.preventDefault();

               var xCurrent = mmEvent.pageX;
               var xDistance = xStart - xCurrent;

               var newLeft = 0;
               if( xDistance > 0 ) {
                  newLeft = Math.min( maxScroll, left + xDistance );
               }
               else {
                  newLeft = Math.max( 0, left + xDistance );
               }

               element.prop( 'scrollLeft', newLeft );
            } );

            doc.one( events.stop + ' focusout', function() {
               doc.off( events.move );
            } );
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         scope.$on( '$destroy', function() {
            svg.off( events.start );
         } );
      }
   };
} ];


export const scrollAreaDirective = {
   name: directiveName,
   factory: directive
};

