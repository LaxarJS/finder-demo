/**
 * Copyright 2017
 * Released under the MIT license
 * https://laxarjs.org/
 */
import { create } from 'laxar';
import artifacts from 'laxar-loader/artifacts?flow=main&theme=cube';

var angularAdapter = require( 'laxar-angular-adapter' );

const config = {
   name: 'finder-demo',
   router: {
      query: {
         enabled: true
      },
      navigo: {
         useHash: true
      }
   },
   logging: {
      threshold: 'TRACE'
   },
   theme: 'cube',
   tooling: {
      enabled: true
   }
};

create( [ angularAdapter ], artifacts, config )
   .tooling( require( 'laxar-loader/debug-info?flow=main&theme=cube' ) )
   .flow( 'main', document.querySelector( '[data-ax-page]' ) )
   .bootstrap();
