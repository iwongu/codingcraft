'use strict'

var BaseController = require('./basecontroller');
var GameApi = require('./gameapi');
var inherits = require('inherits')


var GameController = function($scope, $http, $window, $timeout, topbar) {
  BaseController.call(this, $scope, $http, $window, $timeout, topbar);

  this.initdata = $window.MC_initdata;

  this.currentCode = 0;
  this.autoSavePromise = null;
  this.dirty = false;

  this.loadUser();
  this.loadMap().
    success(angular.bind(this, function(data) {
      this.setupAutoSave();
    })).
    error(angular.bind(this, function() {
    }));
  this.setup();
};
inherits(GameController, BaseController)

GameController.prototype.setCurrentCode = function(current) {
  this.currentCode = current;
};

GameController.prototype.runCode = function(current) {
  var cc = new GameApi(this);
  var str = '(function() {' +
    'var codingcraft = cc;' +
    'var BLOCK = cc.block;' +
    this.codes[current] +
    '})();';
  try {
    eval(str);
    this.syntaxError = '';
  } catch (e) {
    this.syntaxError = e.message;
  }
};

GameController.prototype.saveCodes = function() {
  var params = $.param({'codes': this.codes});
  this.http.post('/_/save_codes/', params).
    success(angular.bind(this, function(data) {
    })).
    error(angular.bind(this, function() {
    }));
};

GameController.prototype.resetMap = function() {
  var size = this.gameSize;
  for (var i = -size; i < size; i++) {
    for (var j = -size; j < size; j++) {
      for (var k = -size; k < size; k++) {
        this.game.setBlock([i, j, k], this.game.generate(i, j, k));
      }
    }
  }
};

GameController.prototype.loadMap = function() {
  var params = $.param({'key': this.initdata.key});
  return this.http.post('/_/load_map_by_id/', params).
    success(angular.bind(this, function(data) {
      if (data.result != 'ok') {
        return;
      }
      this.mapKey = data.key;
      this.drawMap(data.data);
    })).
    error(angular.bind(this, function() {
    }));
};

GameController.prototype.setup = function() {  
  this.setupHighlight();
  this.setupKeys();
  this.setupCover();

  this.game.on('fire', angular.bind(this, function (target, state) {
    var position = this.blockPosPlace;
    if (position) {
      this.game.createBlock(position, this.currentMaterial + 1);
    }
    else {
      position = this.blockPosErase;
      if (position) this.game.setBlock(position, 0);
    }
  }));
};

GameController.prototype.setupAutoSave = function() {  
  this.game.on('setBlock', angular.bind(this, function (pos, val, old) {
    this.dirty = true;
    if (this.autoSavePromise) {
      this.timeout.cancel(this.autoSavePromise);
    }
    this.autoSavePromise = this.timeout(angular.bind(this, function() {
      this.autoSaveMap();
    }), 10 *1000);
  }));

  this.window.onbeforeunload = angular.bind(this, function(event) {
    if (this.dirty) {
      this.saveMap();
      return 'You have unsaved changes. It will be auto-saved in a few seconds. Are you sure you want to leave this page now?';
    }
  });

  this.window.onunload = angular.bind(this, function(event) {
    if (this.dirty) {
      this.saveMap();
    }
  });
};


GameController.prototype.autoSaveMap = function() {
  this.topbar.show_message("Auto saving...");
  this.dirty = false;
  this.saveMap().
    success(angular.bind(this, function(data) {
      this.topbar.hide_message();
    })).
    error(angular.bind(this, function() {
      this.topbar.show_error("Auto saving failed...");
    }));
};


module.exports = GameController;
