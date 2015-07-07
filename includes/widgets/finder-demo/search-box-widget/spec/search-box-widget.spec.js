/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2015
//    by aixigo AG, Aachen, Germany.
//
//  All rights reserved. This material is confidential and proprietary to AIXIGO AG and no part of this
//  material should be reproduced, published in any form by any means, electronic or mechanical including
//  photocopy or any information storage or retrieval system nor should the material be disclosed to third
//  parties without the express written authorization of AIXIGO AG.
//
//  aixigo AG
//  http://www.aixigo.de
//  Aachen, Germany
//
define( [
   'json!../widget.json',
   'laxar-testing',
   //'angular-mocks'
], function( descriptor, testing, ngMocks ) {
   'use strict';

   describe( 'A SearchBoxWidget', function() {

      var searchTermInput;
      var searchButton;

      beforeEach( testing.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-i18n-control.css' ]
      } ) );
      beforeEach( function() {
         testing.widget.configure( {
            search: {
               resource: 'query'
            }
         } );
      } );
      beforeEach( testing.widget.load );
      beforeEach( function() {
         var widgetDom = testing.widget.render();
         searchTermInput = widgetDom.querySelector( '[data-ng-model="model.queryString"]' );
         searchButton = widgetDom.querySelector( 'button[type="submit"]' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( testing.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didNavigate requests', function() {
         expect( testing.widget.axEventBus.subscribe )
            .toHaveBeenCalledWith( 'didNavigate', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the didNavigate event occurs with query parameter', function() {

         beforeEach( function() {
            testing.eventBus.publish( 'didNavigate', {
               data: {
                  query: 'Aachen'
               }
            } );
            testing.eventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the parameter value is directly published as search term', function() {
            expect( testing.widget.axEventBus.publish )
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
            testing.eventBus.publish( 'didNavigate', {
               data: {}
            } );
            testing.eventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'no search term is published', function() {
            expect( testing.widget.axEventBus.publish )
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
            expect( testing.widget.axEventBus.publish )
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
