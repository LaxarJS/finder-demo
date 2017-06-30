/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';

describe( 'A LanguageSelectionActivity', () => {

   let configuredLanguage = 'en';

   beforeEach( axMocks.setupForWidget() );

   beforeEach( () => {

      // Mocking navigator language
      try {
         // FF, Chrome and IE
         Object.defineProperty( window.navigator, 'language', {
            configurable: true,
            get() {
               return 'en';
            }
         } );
      }
      catch( e ) {
         // PhantomJS
         window.navigator.language = 'en';
      }

      axMocks.widget.whenServicesAvailable( services => {
         services.axConfiguration.get
            .and.callFake( ( key, defaultValue ) => {
               if( key === 'i18n.locales.default' ) {
                  return configuredLanguage;
               }
               return defaultValue;
            } );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'if the default language equals the browser language', () => {

      beforeEach( () => {
         configuredLanguage = 'en';
      } );
      beforeEach( axMocks.widget.load );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not subscribe to beginLifecycleRequest', () => {
         expect( axMocks.widget.axEventBus.subscribe ).not.toHaveBeenCalled();
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'if the default language does not equal the browser language', () => {

      beforeEach( () => {
         configuredLanguage = 'de';
      } );
      beforeEach( axMocks.widget.load );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to beginLifecycleRequest', () => {
         expect( axMocks.widget.axEventBus.subscribe )
            .toHaveBeenCalledWith( 'beginLifecycleRequest', jasmine.any( Function ) );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the beginLifecycleRequest was received', () => {

         beforeEach( () => {
            axMocks.eventBus.publish( 'beginLifecycleRequest' );
            axMocks.eventBus.flush();
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a changeLocaleRequest for the language to set', () => {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'changeLocaleRequest.default', {
                  locale: 'default',
                  languageTag: 'en'
               } );
         } );

      } );

   } );

} );

