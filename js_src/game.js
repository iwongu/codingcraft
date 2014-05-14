'use strict'

var GameController = require('./gamecontroller');
var Topbar = require('./topbar');

var ccApp = angular.module('cc', []);

ccApp.controller('GameController', GameController);
ccApp.factory('topbar', Topbar);
ccApp.config(function($httpProvider) {
  $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
});
