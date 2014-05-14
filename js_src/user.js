'use strict'

var UserController = require('./usercontroller');

var ucApp = angular.module('uc', []);

ucApp.controller('UserController', UserController);
ucApp.config(function($httpProvider) {
  $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
});
