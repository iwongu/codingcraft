'use strict'


var UserController = function($scope, $http, $window, topbar) {
  this.scope = $scope;
  this.http = $http;
  this.window = $window;
  this.topbar = topbar;

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
  this.topbar.show_message('saving...');
  var params = $.param({'name': this.name, avatar: this.avatar});
  this.http.post('/_/set_user/', params).
    success(angular.bind(this, function(data) {
      this.topbar.hide_message();
    })).
    error(angular.bind(this, function() {
      this.topbar.show_error("Saving failed...");
    }));
};


module.exports = UserController;
