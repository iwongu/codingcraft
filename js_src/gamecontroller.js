'use strict'

var BaseController = require('./basecontroller');
var GameApi = require('./gameapi');
var inherits = require('inherits')


var GameController = function($scope, $http, $window) {
  BaseController.call(this, $scope, $http, $window);

  this.currentCode = 0;

  this.loadMap();

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
  this.http.post('/_/load_map/').
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
  this.makeFly();
  this.setupHighlight();
  this.setupKeys();
  this.makeWalk();
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


module.exports = GameController;
