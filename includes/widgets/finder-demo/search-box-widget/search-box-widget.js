/**
 * Copyright 2015 LaxarJS
 * Released under the MIT license.
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns'
], function( ng, ax, patterns ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', 'axEventBus' ];

   function Controller( $scope, eventBus ) {

      $scope.model = {
         queryString: ''
      };

      var searchPublisher = patterns.resources.replacePublisherForFeature( $scope, 'search' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      eventBus.subscribe( 'didNavigate', function( event ) {
         var query = ax.object.path( event, 'data.query', '' );
         if( query && query.length > 0 ) {
            $scope.model.queryString = query;
            $scope.functions.startSearch();
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.functions = {

         startSearch: function() {
            searchPublisher( {
               queryString: $scope.model.queryString
            } );
         }

      };

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'searchBoxWidget', [] ).controller( 'SearchBoxWidgetController', Controller );

} );
