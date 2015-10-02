/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'json!../widget.json',
   'laxar-mocks'
], function( descriptor, axMocks ) {
   'use strict';

   describe( 'A SearchBoxWidget', function() {

      var searchTermInput;
      var searchButton;

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-i18n-control.css' ]
      } ) );
      beforeEach( function() {
         axMocks.widget.configure( {
            search: {
               resource: 'query'
            }
         } );
      } );
      beforeEach( axMocks.widget.load );
      beforeEach( function() {
         var widgetDom = axMocks.widget.render();
         searchTermInput = widgetDom.querySelector( '[data-ng-model="model.queryString"]' );
         searchButton = widgetDom.querySelector( 'button[type="submit"]' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didNavigate requests', function() {
         expect( axMocks.widget.axEventBus.subscribe )
            .toHaveBeenCalledWith( 'didNavigate', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the didNavigate event occurs with query parameter', function() {

         beforeEach( function() {
            axMocks.eventBus.publish( 'didNavigate', {
               data: {
                  query: 'Aachen'
               }
            } );
            axMocks.eventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the parameter value is directly published as search term', function() {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.query', {
                  resource: 'query',
                  data: {
                     queryString: 'Aachen'
                  }
               }, jasmine.any( Object ) );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the didNavigate event occurs without query parameter', function() {

         beforeEach( function() {
            axMocks.eventBus.publish( 'didNavigate', {
               data: {}
            } );
            axMocks.eventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'no search term is published', function() {
            expect( axMocks.widget.axEventBus.publish )
               .not.toHaveBeenCalledWith( 'didReplace.query', jasmine.any( Object ), jasmine.any( Object ) );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the user enters a search term and starts a search', function() {

         beforeEach( function() {
            setValue( searchTermInput, 'Aachen' );

            searchButton.click();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the entered query string is published as search term', function() {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.query', {
                  resource: 'query',
                  data: {
                     queryString: 'Aachen'
                  }
               }, jasmine.any( Object ) );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setValue( element, value ) {
         element.value = value;

         triggerSimpleEvent( element, 'change' );
         triggerSimpleEvent( element, 'blur' );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function triggerSimpleEvent( element, eventName ) {
         var event = document.createEvent( 'Event' );
         event.initEvent( eventName, true, true );
         element.dispatchEvent( event );
      }

   } );

} );
