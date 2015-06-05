/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns',
   './messages'
], function( ng, ax, patterns, messages ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', 'axEventBus' ];

   function Controller( $scope, eventBus ) {

      $scope.messages = messages;

      patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n' );

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
