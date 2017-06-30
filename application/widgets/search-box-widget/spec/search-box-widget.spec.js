/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';

describe( 'A SearchBoxWidget', () => {

   let searchTermInput;
   let searchButton;
   beforeEach( axMocks.setupForWidget() );

   beforeEach( () => {
      axMocks.widget.configure( {
         search: {
            resource: 'query'
         }
      } );
   } );
   beforeEach( axMocks.widget.load );
   beforeEach( () => {
      const widgetDom = axMocks.widget.render();
      searchTermInput = widgetDom.querySelector( '[data-ng-model="model.queryString"]' );
      searchButton = widgetDom.querySelector( 'button[type="submit"]' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to didNavigate requests', () => {
      expect( axMocks.widget.axEventBus.subscribe )
         .toHaveBeenCalledWith( 'didNavigate', jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the didNavigate event occurs with query parameter', () => {

      beforeEach( () => {
         axMocks.eventBus.publish( 'didNavigate', {
            data: {
               query: 'Aachen'
            }
         } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'the parameter value is directly published as search term', () => {
         expect( axMocks.widget.axEventBus.publish )
            .toHaveBeenCalledWith( 'didReplace.query', {
               resource: 'query',
               data: {
                  queryString: 'Aachen'
               }
            }, jasmine.any( Object ) );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the didNavigate event occurs without query parameter', () => {

      beforeEach( () => {
         axMocks.eventBus.publish( 'didNavigate', {
            data: {}
         } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'no search term is published', () => {
         expect( axMocks.widget.axEventBus.publish )
            .not.toHaveBeenCalledWith( 'didReplace.query', jasmine.any( Object ), jasmine.any( Object ) );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the user enters a search term and starts a search', () => {

      beforeEach( () => {
         setValue( searchTermInput, 'Aachen' );

         searchButton.click();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'the entered query string is published as search term', () => {
         expect( axMocks.widget.axEventBus.publish )
            .toHaveBeenCalledWith( 'didReplace.query', {
               resource: 'query',
               data: {
                  queryString: 'Aachen'
               }
            }, jasmine.any( Object ) );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function setValue( element, value ) {
      element.value = value;

      triggerSimpleEvent( element, 'change' );
      triggerSimpleEvent( element, 'blur' );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function triggerSimpleEvent( element, eventName ) {
      const event = document.createEvent( 'Event' );
      event.initEvent( eventName, true, true );
      element.dispatchEvent( event );
   }

} );
