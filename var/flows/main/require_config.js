/*jshint quotmark:false,-W079*/
var require = { 
   "baseUrl": "bower_components", 
   "paths": { 
      "laxar": "laxar/dist/laxar.with-deps", 
      "requirejs": "requirejs/require", 
      "text": "requirejs-plugins/lib/text", 
      "json": "requirejs-plugins/src/json", 
      "angular": "angular/angular", 
      "angular-mocks": "angular-mocks/angular-mocks", 
      "angular-route": "angular-route/angular-route", 
      "angular-sanitize": "angular-sanitize/angular-sanitize", 
      "laxar/laxar_testing": "laxar/dist/laxar_testing", 
      "jquery": "jquery/dist/jquery", 
      "jasmine": "jasmine/lib/jasmine-core/jasmine", 
      "q_mock": "q_mock/q", 
      "laxar-mocks": "laxar-mocks/dist/laxar-mocks", 
      "jasmine2": "jasmine2/lib/jasmine-core/jasmine", 
      "laxar-patterns": "laxar-patterns/dist/laxar-patterns", 
      "json-patch": "fast-json-patch/src/json-patch-duplex", 
      "laxar-uikit": "laxar-uikit/dist/laxar-uikit", 
      "laxar-uikit/controls": "laxar-uikit/dist/controls", 
      "bootstrap": "bootstrap-sass-official/assets/javascripts/bootstrap", 
      "laxar-path-root": "..", 
      "laxar-path-layouts": "../application/layouts", 
      "laxar-path-pages": "../application/pages", 
      "laxar-path-flow": "../application/flow/flow.json", 
      "laxar-path-widgets": "../includes/widgets", 
      "laxar-path-themes": "../includes/themes", 
      "laxar-path-default-theme": "laxar-uikit/dist/themes/default.theme", 
      "laxar-application-dependencies": "../var/static/laxar_application_dependencies", 
      "finder-box-control": "../includes/controls/finder-demo/finder-box-control", 
      "finder-demo-utilities": "../includes/lib/finder-demo-utilities", 
      "openlayers": "ol3/build/ol", 
      "fetch": "fetch/fetch", 
      "d3": "d3/d3", 
      "promise-polyfill": "promise-polyfill/Promise"
   }, 
   "map": { 
      "*": { 
         "css": "require-css/css"
      }
   }, 
   "packages": [
      { 
         "name": "laxar-application", 
         "location": "..", 
         "main": "init"
      },
      { 
         "name": "moment", 
         "location": "moment", 
         "main": "moment"
      }
   ], 
   "shim": { 
      "angular": { 
         "exports": "angular"
      }, 
      "angular-mocks": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular.mock;
         }
      }, 
      "angular-route": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular;
         }
      }, 
      "angular-sanitize": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular;
         }
      }, 
      "bootstrap/tooltip": { 
         "deps": [
            "jquery"
         ]
      }, 
      "json-patch": { 
         "exports": "jsonpatch"
      }
   }
};
