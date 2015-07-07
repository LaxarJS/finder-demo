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
   'angular-mocks'
], function( descriptor, testing, ngMocks ) {
   'use strict';

   describe( 'A OmdbSearchWidget', function() {

      var url = 'http://www.omdbapi.com/?y=&plot=short&r=json&s=';
      var detailsUrl = 'http://www.omdbapi.com/?tomatoes=true&plot=full&r=json&i=';
      var $httpBackend;
      var widgetDom;

      beforeEach( testing.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-i18n-control.css', 'finder-demo-utilities.css' ]
      } ) );
      beforeEach( function() {
         testing.widget.configure( 'search.resource', 'search' );
      } );
      beforeEach( testing.widget.load );
      beforeEach( function() {
         widgetDom = testing.widget.render();

         ngMocks.inject( function( $injector ) {
            $httpBackend = $injector.get( '$httpBackend' );
         } );

         testing.triggerStartupEvents();
      } );

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( testing.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didReplace events for the search resource', function() {
         expect( testing.widget.axEventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.search', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'initially is in state IDLE', function() {
         expect( getWidgetState() ).toEqual( 'IDLE' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a search term is received', function() {

         beforeEach( function() {
            $httpBackend.when( 'GET', url + 'Sneakers' )
               .respond( { Search: [ ] } );

            simulateSearchFor( 'Sneakers' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'switches to state SEARCHING', function() {
            expect( getWidgetState() ).toEqual( 'SEARCHING' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when an empty result list is received', function() {

         beforeEach( function() {
            $httpBackend.when( 'GET', url + 'Sneakers' )
               .respond( { Search: [ ] } );

            simulateSearchFor( 'Sneakers' );

            $httpBackend.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'switches to state NO_RESULTS', function() {
            expect( getWidgetState() ).toEqual( 'NO_RESULTS' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when an result list with one result is received', function() {

         beforeEach( function() {
            $httpBackend.when( 'GET', url + 'Sneakers' )
               .respond( { Search: [ { Title: 'Sneakers', imdbID: '123' } ] } );
            $httpBackend.when( 'GET', detailsUrl + '123' ).respond( {} );

            simulateSearchFor( 'Sneakers' );

            $httpBackend.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'switches to state SELECTED', function() {
            expect( getWidgetState() ).toEqual( 'SELECTED' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not render the result select box', function() {
            expect( getMovieSelectBox() ).toEqual( null );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when an result list with multiple results is received', function() {

         beforeEach( function() {
            $httpBackend.when( 'GET', url + 'Sneakers' )
               .respond( {
                  Search: [
                     { Title: 'Sneakers', imdbID: '123' },
                     { Title: 'The Girl in the Sneakers', imdbID: 'ABC' }
                  ]
               } );
            $httpBackend.when( 'GET', detailsUrl + '123' ).respond( { imdbRating: '7.1' } );
            $httpBackend.when( 'GET', detailsUrl + 'ABC' ).respond( { imdbRating: '6.3' } );

            simulateSearchFor( 'Sneakers' );

            $httpBackend.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'switches to state SELECTED', function() {
            expect( getWidgetState() ).toEqual( 'SELECTED' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'renders the result select box with all available results', function() {
            var options = [].map.call( getMovieSelectBox().querySelectorAll( 'option' ), function( option ) {
               return innerText( option );
            } );
            expect( options.length ).toBe( 2 );
            expect( options ).toContain( 'Sneakers' );
            expect( options ).toContain( 'The Girl in the Sneakers' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'fetches the details for the first result', function() {
            expect( getDetailsTableContents() ).toContain( { label: 'IMDb Rating:', value: '7.1' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the user selects another result', function() {

            beforeEach( function() {
               getMovieSelectBox().selectedIndex = 1;

               triggerSimpleEvent( getMovieSelectBox(), 'change' );

               $httpBackend.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'fetches and displays details for this result', function() {
               expect( getDetailsTableContents() ).toContain( { label: 'IMDb Rating:', value: '6.3' } );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function triggerSimpleEvent( element, eventName ) {
         var event = document.createEvent( 'Event' );
         event.initEvent( eventName, true, true );
         element.dispatchEvent( event );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function getWidgetState() {
         return widgetDom.querySelector( '[data-ng-switch-when]' ).getAttribute( 'data-ng-switch-when' );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function getMovieSelectBox() {
         return widgetDom.querySelector( 'select[data-ng-model="model.selectedMovie"]' );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function getDetailsTableContents() {
         return [].map.call( widgetDom.querySelectorAll( 'tr[data-ng-repeat="detail in model.details"]' ),
            function( row ) {
               return {
                  label: innerText( row.querySelector( 'td:nth-child(1)' ) ),
                  value: innerText( row.querySelector( 'td:nth-child(2)' ) )
               };
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function innerText( node ) {
         return node.innerText || node.textContent;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function simulateSearchFor( searchTerm ) {
         testing.eventBus.publish( 'didReplace.search', {
            resource: 'search',
            data: { queryString: searchTerm }
         } );
         testing.eventBus.flush();
      }

   } );

} );