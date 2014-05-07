'use strict'

var GameController = require('./gamecontroller');

var ccApp = angular.module('cc', []);

ccApp.controller('GameController', GameController);
ccApp.config(function($httpProvider) {
  $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
});
