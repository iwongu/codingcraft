'use strict'

var createGame = require('voxel-engine');
var fly = require('voxel-fly');
var highlight = require('voxel-highlight');
var player = require('voxel-player');
var voxel = require('voxel');
var walk = require('voxel-walk');


// it seems the best way to change gravity.
createGame.prototype.gravity = [0, -0.000008, 0];


var BaseController = function(scope, http, window, timeout, topbar) {
  window.game = this; // for debugging

  this.scope = scope;
  this.http = http;
  this.window = window;
  this.topbar = topbar;
  this.timeout = timeout;

  this.initdata = this.window.MC_initdata;

  var containerEl = window.document.getElementById('container');

  this.gameSize = {x:40, y:30, z:40};
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
      if ((i*i + j*j + k*k) < this.gameSize.x*this.gameSize.x) {
        return j == 0 ? 1 : 3;
      }
      return 0;
    }),
    chunkDistance: 2,
    container: containerEl,
    materials: this.materials,
    worldOrigin: [0, 0, 0],
    playerHeight: 1.62,
    controls: {
      discreteFire: true,
      speed: 0.0032,
      maxSpeed: 0.0112,
      jumpMaxSpeed: 0.01,
      jumpMaxTimer: 100,
      jumpSpeed: 0.004
    }
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

  this.status = {};
  this.status.flying = false;

  this.blockPosErase = null;

  this.userId = null;
  this.name = null;
  this.skin = null;

  this.highlightDistance = 8;

  this.codeCount = 5;
  this.codes = [];
  for (var i = 0; i < this.codeCount; i++) {
    this.codes[i] = '';
  }
};

BaseController.prototype.isInGame = function(x, y, z) {
  return Math.abs(x) <= this.gameSize.x &&
      Math.abs(y) <= this.gameSize.y &&
      Math.abs(z) <= this.gameSize.z;
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
      this.userId = data.user_id;
      this.name = data.name;
      this.skin = data.avatar;
      for (var i = 0; i < this.codeCount; i++) {
        this.codes[i] = data.codes[i] || '';
      }

      this.setPlayer();

      this.status.username = this.name;
    })).
    error(angular.bind(this, function() {
    }));
};

BaseController.prototype.iterBlocks = function(callback) {
  for (var i = -this.gameSize.x; i < this.gameSize.x; i++) {
    for (var j = -this.gameSize.y; j < this.gameSize.y; j++) {
      for (var k = -this.gameSize.z; k < this.gameSize.z; k++) {
        callback(i, j, k);
      }
    }
  }
};

BaseController.prototype.getMapData = function() {
  var data = {
    data: [],
    cnt: 0,
    material: -1
  };
  this.iterBlocks(angular.bind(this, function(data, i, j, k) {
    var m = this.game.getBlock([i, j, k]);
    if (m != data.material) {
      if (data.cnt != 0) {
        data.data.push(data.cnt);
        data.data.push(data.material);
      }
      data.cnt = 1;
      data.material = m;
    } else {
      data.cnt += 1;
    }
  }, data));
  if (data.cnt != 0) {
    data.data.push(data.cnt);
    data.data.push(data.material);
  }  
  return data.data;
};

BaseController.prototype.loadMap = function() {
  this.topbar.show_message('loading map...');
  var params = $.param({'key': this.initdata.key});
  return this.http.post('/_/load_map_by_id/', params).
    success(angular.bind(this, function(data) {
      this.topbar.hide_message();
      if (data.result != 'ok') {
        return;
      }
      this.mapKey = data.key;
      this.drawMap(angular.fromJson(data.data));
    })).
    error(angular.bind(this, function() {
      this.topbar.show_error("map loading failed...");
    }));
};

BaseController.prototype.saveMap = function() {
  var data = angular.toJson(this.getMapData());
  var params = $.param({'data': data});
  return this.http.post('/_/save_map/', params);
};

BaseController.prototype.resetMap = function() {
  this.topbar.show_message('resetting map...');
  this.iterBlocks(angular.bind(this, function(i, j, k) {
    this.game.setBlock([i, j, k], this.game.generate(i, j, k));
  }));
  this.topbar.hide_message();
};

BaseController.prototype.drawMap = function(data) {
  var cbdata = {
    index: 0,
    cnt: 0,
    material: -1,
    data: data
  };
  cbdata.cnt = cbdata.data[cbdata.index];
  cbdata.material = cbdata.data[cbdata.index+1];
  cbdata.index += 2;

  this.iterBlocks(angular.bind(this, function(cbdata, i, j, k) {
    this.game.setBlock([i, j, k], cbdata.material);
    cbdata.cnt -= 1;
    if (cbdata.cnt == 0) {
      cbdata.cnt = cbdata.data[cbdata.index];
      cbdata.material = cbdata.data[cbdata.index+1];
      cbdata.index += 2;
    }
  }, cbdata));
};

BaseController.prototype.makeFly = function() {
  var makeFly = fly(this.game);
  var target = this.game.controls.target();
  this.game.flyer = makeFly(target, true);
}; 

BaseController.prototype.getNormalVector = function() {
  var cp = this.game.cameraPosition();
  var cv = this.game.cameraVector();
  var hit = this.game.raycastVoxels(cp, cv, this.highlightDistance);
  return hit.normal;
};

BaseController.prototype.onEnterKey = function(ev) {
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

BaseController.prototype.setup = function() {  
  this.setupHighlight();
  this.setupKeys();
  this.setupCover();
  this.setupFire();

  this.game.on('missingChunk', angular.bind(this, function (chunkPosition) {
    debugger;
  }));
};

BaseController.prototype.setupHighlight = function() {
  // highlight blocks when you look at them, hold <Ctrl> for block placement
  var hl = this.game.highlighter = highlight(this.game, {
    color: 0xff0000,
    distance: this.highlightDistance,
    wireframeLinewidth: 1,
    adjacentActive: function() {}
  });
  hl.on('highlight', angular.bind(this, function (hl, voxelPos) {
    this.blockPosErase = voxelPos;
    this.status.targetblock = this.blockPosErase;
    this.scope.$apply();
  }, hl));
  hl.on('remove', angular.bind(this, function (voxelPos) {
    this.blockPosErase = null;
    this.status.targetblock = this.blockPosErase;
    this.scope.$apply();
  }));
};

BaseController.prototype.setupKeys = function() {
  var spaceCount = 0;
  var spaceTime = Date.now();

  window.addEventListener('keydown', angular.bind(this, function (ev) {
    if (ev.keyCode === 'R'.charCodeAt(0)) {
      // toggle between first and third person modes
      this.avatar.toggle();
    }

    if (ev.target.tagName == 'TEXTAREA' || ev.target.tagName == 'INPUT') {
      return;
    }

    var codeOffset = '1'.charCodeAt(0);
    for (var i = 0; i < this.codeCount; i++) {
      if (ev.keyCode === codeOffset + i) {
        this.runCode(i);
      }
    }
    if (ev.keyCode == 9) { // Tab key
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
    if (ev.keyCode == 13) { // Enter key
      this.onEnterKey(ev);
    }
    if (ev.keyCode === 'F'.charCodeAt(0)) {
      if (this.game.flyer.flying) {
        this.game.flyer.stopFlying();
      } else {
        this.game.flyer.startFlying();
        this.avatar.position.y += 0.2;
      }
      this.status.flying = this.game.flyer.flying;
    }
    this.scope.$apply();
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

BaseController.prototype.setupFire = function() {  
  this.game.on('fire', angular.bind(this, function (target, state) {
    if (!this.blockPosErase) {
      return;
    }
    if (state.fire) {
      this.onFire(this.blockPosErase);
    }
    if (state.firealt) {
      var vec = this.getNormalVector();
      var position = [
        this.blockPosErase[0] + vec[0],
        this.blockPosErase[1] + vec[1],
        this.blockPosErase[2] + vec[2]];
      this.onFireAlt(position);
    }
  }));
};

BaseController.prototype.onFire = function() {};
BaseController.prototype.onFireAlt = function() {};

module.exports = BaseController;
