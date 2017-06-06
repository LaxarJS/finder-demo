/**
 * Copyright 2017
 * Released under the MIT license
 * https://laxarjs.org/
 */
import { module } from 'angular';

Controller.$inject = [ '$scope' ];
function Controller( $scope ) {
   $scope.message = 'Hello World!';
}

export const name = module( 'angularHelloWorldWidget', [] )
   .controller( 'AngularHelloWorldWidgetController', Controller ).name;
