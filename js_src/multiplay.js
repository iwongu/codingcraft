'use strict'

var MultiplayController = require('./multiplaycontroller');

var mcApp = angular.module('mc', []);

mcApp.controller('MultiplayController', MultiplayController);
mcApp.config(function($httpProvider) {
  $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
});
