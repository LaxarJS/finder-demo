/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'laxar'
], function( ax ) {
   'use strict';

   var injections = [ 'axEventBus', 'axConfiguration' ];

   function create( eventBus, config ) {
      // IE < 11 needs `window.navigator.browserLanguage`
      var browserLanguage = ( window.navigator.language || window.navigator.browserLanguage ).split( '-' )[0];
      var defaultLanguage = config.get( 'i18n.locales.default', 'en' );
      var supportedLanguages = [ 'de', 'en' ];
      var language = supportedLanguages.indexOf( browserLanguage ) === -1 ? defaultLanguage : browserLanguage;
      language = 'de';
      if( language === defaultLanguage ) {
         return;
      }

      eventBus.subscribe( 'beginLifecycleRequest', function() {
         eventBus.publish( 'changeLocaleRequest.default', { locale: 'default', languageTag: language } );
      } );

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      injections: injections,
      create: create,
      name: 'language-selection-activity'
   };

} );
