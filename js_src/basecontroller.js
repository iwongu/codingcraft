'use strict'

var createGame = require('voxel-engine')
var fly = require('voxel-fly')
var highlight = require('voxel-highlight')
var player = require('voxel-player')
var voxel = require('voxel')
var walk = require('voxel-walk')


// it seems the best way to change gravity.
createGame.prototype.gravity = [0, -0.000008, 0];


var BaseController = function(scope, http, window) {
  window.game = this; // for debugging

  this.scope = scope;
  this.http = http;
  this.window = window;

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

  this.createPlayer = player(this.game);

  // create the player from a minecraft skin file and tell the
  // game to use it as the main player
  this.skinOpts = {
    scale: new this.game.THREE.Vector3(0.04, 0.04, 0.04)
  };

  this.avatar = null;

  this.mapKey = null;

  this.currentMaterial = 0;
  this.hideCover = false;

  this.blockPosPlace = null;
  this.blockPosErase = null;

  this.name = null;
  this.skin = null;

  this.codeCount = 5;
  this.codes = [];
  for (var i = 0; i < this.codeCount; i++) {
    this.codes[i] = '';
  }

  this.loadUser().
    success(angular.bind(this, function() {
      this.setPlayer();
    }));
};

BaseController.prototype.setPlayer = function() {
  this.avatar = this.createPlayer('images/' + this.skin + '.png',
                                  angular.copy(this.skinOpts));
  this.avatar.possess();
  this.avatar.position.set(this.getRandomInt(0, 20) - 10,
                           1,
                           this.getRandomInt(0, 20) - 10);

  this.makeFly();
  this.makeWalk();
};

BaseController.prototype.getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

BaseController.prototype.loadUser = function() {
  return this.http.post('/_/get_user/').
    success(angular.bind(this, function(data) {
      if (data.result != 'ok') {
        return;
      }
      this.name = data.name;
      this.skin = data.avatar;
      for (var i = 0; i < this.codeCount; i++) {
        this.codes[i] = data.codes[i] || '';
      }
    })).
    error(angular.bind(this, function() {
    }));
};

BaseController.prototype.saveMap = function() {
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

BaseController.prototype.drawMap = function(data) {
  var size = this.gameSize;
  var codeOffset = '0'.charCodeAt(0);
  for (var i = -size; i < size; i++) {
    for (var j = -size; j < size; j++) {
      for (var k = -size; k < size; k++) {
        var index =
          (i + size) * (size * 2) * (size * 2) +
          (j + size) * (size * 2) +
          (k + size);
        var block = data[index];
        this.game.setBlock([i, j, k], block.charCodeAt(0) - codeOffset);
      }
    }
  }
};

BaseController.prototype.makeFly = function() {
  var makeFly = fly(this.game);
  var target = this.game.controls.target();
  this.game.flyer = makeFly(target);
}; 

BaseController.prototype.setupHighlight = function() {
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
};

BaseController.prototype.setupKeys = function() {
  window.addEventListener('keydown', angular.bind(this, function (ev) {
    if (ev.keyCode === 'R'.charCodeAt(0)) {
      // toggle between first and third person modes
      this.avatar.toggle();
    }

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
};

BaseController.prototype.makeWalk = function() {
  this.game.on('tick', angular.bind(this, function() {
    var target = this.game.controls.target();
    walk.render(target.playerSkin);
    var vx = Math.abs(target.velocity.x);
    var vz = Math.abs(target.velocity.z);
    if (vx > 0.001 || vz > 0.001) walk.stopWalking();
    else walk.startWalking();
  }));
};

BaseController.prototype.setupCover = function() {
  this.game.interact.on('attain', angular.bind(this, function() {
    this.hideCover = true;
    this.scope.$apply();
  }));
  this.game.interact.on('release', angular.bind(this, function() {
    this.hideCover = false;
    this.scope.$apply();
  }));
};

module.exports = BaseController;
