/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

export const injections = [ 'axEventBus', 'axConfiguration' ];

export function create( eventBus, config ) {
   // IE < 11 needs `window.navigator.browserLanguage`
   const browserLanguage = ( window.navigator.language ||
                             window.navigator.browserLanguage ).split( '-' )[ 0 ];
   const defaultLanguage = config.get( 'i18n.locales.default', 'en' );
   const supportedLanguages = [ 'de', 'en' ];
   const language = supportedLanguages.indexOf( browserLanguage ) === -1 ? defaultLanguage : browserLanguage;

   if( language === defaultLanguage ) {
      return;
   }

   eventBus.subscribe( 'beginLifecycleRequest', () => {
      eventBus.publish( 'changeLocaleRequest.default', { locale: 'default', languageTag: language } );
   } );
}
