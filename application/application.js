// See https://github.com/LaxarJS/laxar/blob/master/docs/manuals/configuration.md
window.laxar = ( function() {
   'use strict';

   var modeAttribute = 'data-ax-application-mode';
   var mode = document.querySelector( 'script[' + modeAttribute + ']' ).getAttribute( modeAttribute );

   return {
      name: 'finder-demo',
      description: 'The Almighty Finder of Things.',

      theme: 'cube',
      useMergedCss: mode === 'PRODUCTION',

      fileListings: {
         'application': 'var/listing/application_resources.json',
         'bower_components': 'var/listing/bower_components_resources.json',
         'includes': 'var/listing/includes_resources.json'
      },
      useEmbeddedFileListings: mode === 'PRODUCTION',

      i18n: {
         locales: {
            'default': 'en'
         }
      },

      eventBusTimeoutMs: (mode === 'PRODUCTION' ? 120 : 10) * 1000

   };

} )();
