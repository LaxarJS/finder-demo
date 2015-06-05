define( [
   'laxar-uikit/controls/i18n/ax-i18n-control',
   'finder_demo_utilities/finder_demo_utilities',
   'laxar-application/includes/widgets/finder-demo/search-box-widget/search-box-widget',
   'laxar-application/includes/widgets/finder-demo/omdb-search-widget/omdb-search-widget',
   'laxar-application/includes/widgets/finder-demo/wikipedia-search-widget/wikipedia-search-widget',
   'laxar-application/includes/widgets/finder-demo/music-brainz-search-widget/music-brainz-search-widget',
   'laxar-application/includes/widgets/finder-demo/open-street-map-widget/open-street-map-widget',
   'laxar-application/includes/widgets/finder-demo/language-selection-activity/language-selection-activity'
], function() {
   'use strict';

   var modules = [].slice.call( arguments );
   return {
      'angular': modules.slice( 0, 7 ),
      'plain': modules.slice( 7, 8 )
   };
} );
