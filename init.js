/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import { create } from 'laxar';
import artifacts from 'laxar-loader/artifacts?flow=main&theme=cube';
import debugInfo from 'laxar-loader/debug-info?flow=main&theme=cube';

import * as angularAdapter from 'laxar-angular-adapter';

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
   theme: 'cube'
};

create( [ angularAdapter ], artifacts, config )
   .tooling( debugInfo )
   .flow( 'main', document.querySelector( '[data-ax-page]' ) )
   .bootstrap();
