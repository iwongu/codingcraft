'use strict'

var MultiplayController = require('./multiplaycontroller');
var Topbar = require('./topbar');

var mcApp = angular.module('mc', []);

mcApp.controller('MultiplayController', MultiplayController);
mcApp.factory('topbar', Topbar);
mcApp.config(function($httpProvider) {
  $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
});
