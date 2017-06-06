/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'laxar'
], function( descriptor, axMocks, ax ) {
   'use strict';

   describe( 'A LanguageSelectionActivity', function() {

      var configuredLanguage = 'en';

      beforeEach( axMocks.createSetupForWidget( descriptor ) );
      beforeEach( function() {

         // Mocking navigator language
         try {
            // FF, Chrome and IE
            Object.defineProperty( window.navigator, 'language', {
               configurable: true,
               get: function () {
                  return 'en';
               }
            } );
         }
         catch( e ) {
            // PhantomJS
            window.navigator.language = 'en';
         }

         var origGet = ax.configuration.get;

         spyOn( ax.configuration, 'get' ).and.callFake( function( key, defaultValue ) {
            if( key === 'i18n.locales.default' ) {
               return configuredLanguage;
            }
            return origGet.call( ax.configuration, key, defaultValue );
         } );
      } );

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'if the default language equals the browser language', function() {

         beforeEach( function() {
            configuredLanguage = 'en';
         } );
         beforeEach( axMocks.widget.load );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not subscribe to beginLifecycleRequest', function() {
            expect( axMocks.widget.axEventBus.subscribe ).not.toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'if the default language does not equal the browser language', function() {

         beforeEach( function() {
            configuredLanguage = 'de';
         } );
         beforeEach( axMocks.widget.load );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to beginLifecycleRequest', function() {
            expect( axMocks.widget.axEventBus.subscribe )
               .toHaveBeenCalledWith( 'beginLifecycleRequest', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the beginLifecycleRequest was received', function() {

            beforeEach( function() {
               axMocks.eventBus.publish( 'beginLifecycleRequest' );
               axMocks.eventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a changeLocaleRequest for the language to set', function() {
               expect( axMocks.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'changeLocaleRequest.default', {
                     locale: 'default',
                     languageTag: 'en'
                  } );
            } );

         } );

      } );

   } );
} );
