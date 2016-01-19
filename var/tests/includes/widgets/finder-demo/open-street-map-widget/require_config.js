/*jshint quotmark:false,-W079*/
var require = { 
   "baseUrl": "bower_components", 
   "paths": { 
      "requirejs": "requirejs/require", 
      "jquery": "jquery/dist/jquery", 
      "angular": "angular/angular", 
      "angular-mocks": "angular-mocks/angular-mocks", 
      "angular-route": "angular-route/angular-route", 
      "angular-sanitize": "angular-sanitize/angular-sanitize", 
      "jjv": "jjv/lib/jjv", 
      "jjve": "jjve/jjve", 
      "jasmine2": "jasmine2/lib/jasmine-core/jasmine", 
      "text": "requirejs-plugins/lib/text", 
      "json": "requirejs-plugins/src/json", 
      "json-patch": "fast-json-patch/src/json-patch-duplex", 
      "bootstrap": "bootstrap-sass-official/assets/javascripts/bootstrap", 
      "laxar-path-root": "..", 
      "laxar-path-layouts": "../application/layouts", 
      "laxar-path-pages": "../application/pages", 
      "laxar-path-widgets": "../includes/widgets", 
      "laxar-path-themes": "../includes/themes", 
      "laxar-path-flow": "../application/flow/flow.json", 
      "laxar-application-dependencies": "../var/static/laxar_application_dependencies", 
      "laxar": "laxar/dist/laxar", 
      "laxar-mocks": "laxar-mocks/dist/laxar-mocks", 
      "laxar-patterns": "laxar-patterns/dist/laxar-patterns", 
      "laxar-uikit": "laxar-uikit/dist/laxar-uikit", 
      "laxar-uikit/controls": "laxar-uikit/dist/controls", 
      "laxar-path-default-theme": "laxar-uikit/dist/themes/default.theme", 
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