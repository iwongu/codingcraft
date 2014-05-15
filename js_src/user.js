'use strict'

var UserController = require('./usercontroller');
var Topbar = require('./topbar');

var ucApp = angular.module('uc', []);

ucApp.controller('UserController', UserController);
ucApp.factory('topbar', Topbar);
ucApp.config(function($httpProvider) {
  $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
});
