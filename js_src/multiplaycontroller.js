'use strict'

var BaseController = require('./basecontroller');
var inherits = require('inherits')
var skin = require('minecraft-skin')

var MultiplayController = function($scope, $http, $window) {
  BaseController.call(this, $scope, $http, $window);

  this.initdata = $window.MC_initdata;
  this.initdata.socket.onopen = angular.bind(this, this.onOpen);
  this.initdata.socket.onmessage = angular.bind(this, this.onMessage);
  this.initdata.socket.onerror = angular.bind(this, this.onError);
  this.initdata.socket.onclose = angular.bind(this, this.onClose);

  this.players = {};

  this.prevPosition = {x: 0, y: 0, z: 0};

  this.loadMap();

  this.setup();
};
inherits(MultiplayController, BaseController)

/*
MultiplayController.prototype.runCode = function(current) {
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
*/

MultiplayController.prototype.loadMap = function() {
  var params = $.param({'key': this.initdata.key});
  this.http.post('/_/load_map_by_id/', params).
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

MultiplayController.prototype.setup = function() {  
  this.makeFly();
  this.setupHighlight();
  this.setupKeys();
  this.makeWalk();
  this.setupCover();
  this.setupPing();

  this.game.on('fire', angular.bind(this, function (target, state) {
    var blocks = [];
    var position = this.blockPosPlace;
    if (position) {
      blocks.push({position: position, material: this.currentMaterial + 1});
    }
    else {
      position = this.blockPosErase;
      if (position) blocks.push({position: position, material: 0});
    }

    if (blocks.length == 0) {
      return;
    }

    var message = {
      blocks: blocks,
      player: {
        skin: this.skin,
        position: this.avatar.position,
        rotation: this.avatar.rotation,
        velocity: this.avatar.velocity
      }
    };
    var params = $.param({
      'token': this.initdata.token,
      'message': angular.toJson(message)
    });
    this.http.post('/_/send_message/', params).
      success(angular.bind(this, function(data) {
      })).
      error(angular.bind(this, function() {
      }));
  }));
};

MultiplayController.prototype.onOpen = function() {  
};

MultiplayController.prototype.onMessage = function(message) {  
  var data = angular.fromJson(message.data);
  var userId = data.user_id;
  var message = angular.fromJson(data.message);
  var blocks = message.blocks;
  var player = message.player;
  if (blocks) {
    for (var i = 0; i < blocks.length; i++) {
      this.game.setBlock(blocks[i].position, blocks[i].material);
    }
  }
  if (player) {
    if (userId != this.initdata.user_id) {
      if (!this.players[userId]) {
        this.players[userId] =
          skin(this.game.THREE, 'images/' + player.skin + '.png',
               angular.copy(this.skinOpts));
        this.game.scene.add(this.players[userId].mesh);
      }
      this.players[userId].mesh.position.x = player.position.x;
      this.players[userId].mesh.position.y = player.position.y;
      this.players[userId].mesh.position.z = player.position.z;

      this.players[userId].mesh.rotation.x = player.rotation.x;
      this.players[userId].mesh.rotation.y = player.rotation.y;
      this.players[userId].mesh.rotation.z = player.rotation.z;
    }
  }
};

MultiplayController.prototype.setupPing = function() {
  this.game.on('tick', angular.bind(this, function() {
    if (Math.abs(this.avatar.position.x - this.prevPosition.x) +
        Math.abs(this.avatar.position.y - this.prevPosition.y) +
        Math.abs(this.avatar.position.z - this.prevPosition.z) <= 0.5) {
      return;
    }
    this.prevPosition.x = this.avatar.position.x;
    this.prevPosition.y = this.avatar.position.y;
    this.prevPosition.z = this.avatar.position.z;

    var message = {
      player: {
        skin: this.skin,
        position: this.avatar.position,
        rotation: this.avatar.rotation,
        velocity: this.avatar.velocity
      }
    };
    var params = $.param({
      'token': this.initdata.token,
      'message': angular.toJson(message)
    });
    this.http.post('/_/send_message/', params).
      success(angular.bind(this, function(data) {
      })).
      error(angular.bind(this, function() {
      }));
  }));
};

MultiplayController.prototype.onError = function(error) {  
};

MultiplayController.prototype.onClose = function() {  
};

module.exports = MultiplayController;
