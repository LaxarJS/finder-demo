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
   'laxar'
], function( descriptor, testing, ax ) {
   'use strict';

   describe( 'A LanguageSelectionActivity', function() {

      var configuredLanguage = 'en';

      beforeEach( testing.createSetupForWidget( descriptor ) );
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

      afterEach( testing.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'if the default language equals the browser language', function() {

         beforeEach( function() {
            configuredLanguage = 'en';
         } );
         beforeEach( testing.widget.load );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not subscribe to beginLifecycleRequest', function() {
            expect( testing.widget.axEventBus.subscribe ).not.toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'if the default language does not equal the browser language', function() {

         beforeEach( function() {
            configuredLanguage = 'de';
         } );
         beforeEach( testing.widget.load );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to beginLifecycleRequest', function() {
            expect( testing.widget.axEventBus.subscribe )
               .toHaveBeenCalledWith( 'beginLifecycleRequest', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the beginLifecycleRequest was received', function() {

            beforeEach( function() {
               testing.eventBus.publish( 'beginLifecycleRequest' );
               testing.eventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a changeLocaleRequest for the language to set', function() {
               expect( testing.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'changeLocaleRequest.default', {
                     locale: 'default',
                     languageTag: 'en'
                  } );
            } );

         } );

      } );

   } );
} );
