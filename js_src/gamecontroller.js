'use strict'

var createGame = require('voxel-engine')
var highlight = require('voxel-highlight')
var player = require('voxel-player')
var voxel = require('voxel')
var extend = require('extend')
var fly = require('voxel-fly')
var walk = require('voxel-walk')
var GameApi = require('./gameapi');

var GameController = function($scope, $http) {
  //window.game = this; // for debugging

  this.scope = $scope;
  this.http = $http;

  var containerEl = window.document.getElementById('container');

  this.gameSize = 30;

  this.materials = [
      ['grass', 'dirt', 'grass_dirt'],
      'brick',
      'dirt',
      'diamond',
      'bedrock',
      'bluewool',
      'cobblestone',
      'crate',
      'glowstone',
      'netherrack',
      'obsidian',
      'plank',
      'redwool',
      'whitewool'];

  var opts = {
    generate: angular.bind(this, function(i,j,k) {
      if (j > 0) { return 0; }
      if ((i*i + j*j + k*k) < this.gameSize*this.gameSize) {
        return j == 0 ? 1 : 3;
      }
      return 0;
    }),
    chunkDistance: 2,
    container: containerEl,
    materials: this.materials,
    worldOrigin: [0, 0, 0],
    controls: { discreteFire: true }
  };

  this.game = createGame(opts);
  this.game.appendTo(containerEl);
  if (this.game.notCapable()) return this.game;

  var createPlayer = player(this.game);

  // create the player from a minecraft skin file and tell the
  // game to use it as the main player
  this.avatar = createPlayer('images/player.png');
  this.avatar.possess();
  this.avatar.position.set(0, 1, 0);

  this.setup();

  this.icons = [
    'grass',
    'brick',
    'dirt',
    'diamond',
    'bedrock',
    'bluewool',
    'cobblestone',
    'crate',
    'glowstone',
    'netherrack',
    'obsidian',
    'plank',
    'redwool',
    'whitewool'];

  this.currentMaterial = 0;
  this.hideCover = false;

  this.blockPosPlace = null;
  this.blockPosErase = null;

  this.codeCount = 5;
  this.codes = [];
  for (var i = 0; i < this.codeCount; i++) {
    this.codes[i] = '';
  }
  this.currentCode = 0;

  this.loadMap();
  this.loadCodes();
};

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

GameController.prototype.loadCodes = function() {
  this.http.post('/_/load_codes/').
    success(angular.bind(this, function(data) {
      if (data.result != 'ok') {
        return;
      }
      for (var i = 0; i < this.codeCount; i++) {
        this.codes[i] = data.codes[i] || '';
      }
    })).
    error(angular.bind(this, function() {
    }));
};

GameController.prototype.saveMap = function() {
  var size = this.gameSize;
  var data = '';
  var codeOffset = '0'.charCodeAt(0);
  for (var i = -size; i < size; i++) {
    for (var j = -size; j < size; j++) {
      for (var k = -size; k < size; k++) {
        data += String.fromCharCode(codeOffset + this.game.getBlock([i, j, k]));
      }
    }
  }

  var params = $.param({'data': data});
  this.http.post('/_/save_map/', params).
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
      var size = this.gameSize;
      var codeOffset = '0'.charCodeAt(0);
      for (var i = -size; i < size; i++) {
        for (var j = -size; j < size; j++) {
          for (var k = -size; k < size; k++) {
            var index =
              (i + size) * (size * 2) * (size * 2) +
              (j + size) * (size * 2) +
              (k + size);
            var block = data.data[index];
            this.game.setBlock([i, j, k], block.charCodeAt(0) - codeOffset);
          }
        }
      }
    })).
    error(angular.bind(this, function() {
    }));
};

GameController.prototype.setup = function() {  
  var makeFly = fly(this.game);
  var target = this.game.controls.target();
  this.game.flyer = makeFly(target);
  
  // highlight blocks when you look at them, hold <Ctrl> for block placement
  var hl = this.game.highlighter = highlight(this.game, {color: 0xff0000, distance: 8});
  hl.on('highlight', angular.bind(this, function (voxelPos) {
    this.blockPosErase = voxelPos;
    this.scope.$apply();
  }));
  hl.on('remove', angular.bind(this, function (voxelPos) {
    this.blockPosErase = null;
    this.scope.$apply();
  }));
  hl.on('highlight-adjacent', angular.bind(this, function (voxelPos) {
    this.blockPosPlace = voxelPos;
    this.scope.$apply();
  }));
  hl.on('remove-adjacent', angular.bind(this, function (voxelPos) {
    this.blockPosPlace = null;
    this.scope.$apply();
  }));

  // toggle between first and third person modes
  window.addEventListener('keydown', angular.bind(this, function (ev) {
    /*
    if (ev.keyCode === 'R'.charCodeAt(0)) {
      this.avatar.toggle();
    }
    */

    var codeOffset = '1'.charCodeAt(0);
    for (var i = 0; i < this.codeCount; i++) {
      if (ev.keyCode === codeOffset + i) {
        if (ev.altKey) {
          this.runCode(i);
        }
      }
    }
    if (ev.keyCode == 9) {
      if (ev.shiftKey) {
        if (this.currentMaterial == 0) {
          this.currentMaterial = this.materials.length - 1;
        } else {
          this.currentMaterial -= 1;
        }
      } else {
        this.currentMaterial = (this.currentMaterial + 1) % this.materials.length;
      }
    }
    this.scope.$apply();
  }));

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

  /*
  this.game.on('tick', angular.bind(this, function() {
    walk.render(target.playerSkin);
    var vx = Math.abs(target.velocity.x);
    var vz = Math.abs(target.velocity.z);
    if (vx > 0.001 || vz > 0.001) walk.stopWalking();
    else walk.startWalking();
  }));
  */

  this.game.interact.on('attain', angular.bind(this, function() {
    this.hideCover = true;
    this.scope.$apply();
  }));
  this.game.interact.on('release', angular.bind(this, function() {
    this.hideCover = false;
    this.scope.$apply();
  }));
};


module.exports = GameController;
