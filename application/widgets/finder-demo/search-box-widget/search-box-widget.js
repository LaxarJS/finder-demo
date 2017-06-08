/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */

import * as ng from 'angular';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';
import messages from './messages';

Controller.$inject = [ '$scope', 'axEventBus', 'axI18n' ];

function Controller( $scope, eventBus, i18n ) {

   $scope.messages = messages;
   $scope.i18n = i18n;

   patterns.i18n.handlerFor( $scope ).registerLocaleFromFeature( 'i18n' );

   $scope.model = {
      queryString: ''
   };

   const searchPublisher = patterns.resources.replacePublisherForFeature( $scope, 'search' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   eventBus.subscribe( 'didNavigate', event => {
      const query = ax.object.path( event, 'data.query', '' );
      if( query && query.length > 0 ) {
         $scope.model.queryString = query;
         $scope.functions.startSearch();
      }
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.functions = {
      startSearch: () => {
         searchPublisher( {
            queryString: $scope.model.queryString
         } );
      }
   };

   // Event for testing other widgets
   eventBus.subscribe( 'beginLifecycleRequest',  () => {
      searchPublisher( {
         queryString: 'The Doors'
      } );
   } );

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'searchBoxWidget', [] )
   .controller( 'SearchBoxWidgetController', Controller ).name;


