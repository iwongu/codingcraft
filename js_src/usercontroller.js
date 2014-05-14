'use strict'


var UserController = function($scope, $http, $window) {
  this.scope = $scope;
  this.http = $http;
  this.window = $window;

  this.name = null;
  this.avatar = null;

  this.http.post('/_/get_user/').
    success(angular.bind(this, function(data) {
      if (data.result == 'ok') {
        this.name = data.name;
        this.avatar = data.avatar;
      }
    })).
    error(angular.bind(this, function() {
    }));
};

UserController.prototype.save = function() {
  var params = $.param({'name': this.name, avatar: this.avatar});
  this.http.post('/_/set_user/', params).
    success(angular.bind(this, function(data) {
    })).
    error(angular.bind(this, function() {
    }));
};


module.exports = UserController;
