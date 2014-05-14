'use strict'

var BaseController = require('./basecontroller');
var inherits = require('inherits')
var skin = require('minecraft-skin')

var MultiplayController = function($scope, $http, $window) {
  BaseController.call(this, $scope, $http, $window);

  this.initdata = $window.MC_initdata;
  this.socket = null;
  this.openSocket();

  this.players = {};

  this.prevPosition = {x: 0.0, y: 0.0, z: 0.0};
  this.prevRotation = {x: 0.0, y: 0.0, z: 0.0};

  this.freezed = true;

  this.loadUser().
    success(angular.bind(this, function() {
      if (this.userId == this.initdata.map_owner_id) {
        this.freezed = false;
      }
    }));
  this.loadMap();
  this.setup();
};
inherits(MultiplayController, BaseController)

MultiplayController.prototype.openSocket = function() {
  this.socket = this.initdata.channel.open();
  this.socket.onopen = angular.bind(this, this.onOpen);
  this.socket.onmessage = angular.bind(this, this.onMessage);
  this.socket.onerror = angular.bind(this, this.onError);
  this.socket.onclose = angular.bind(this, this.onClose);
};

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
  this.setupHighlight();
  this.setupKeys();
  this.setupCover();

  this.game.on('fire', angular.bind(this, function (target, state) {
    if (this.freezed) {
      return;
    }

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
    };
    this.sendMessage(message);
  }));
};

MultiplayController.prototype.sendMessage = function(message) {  
  var params = $.param({
    'token': this.initdata.token,
    'message': angular.toJson(message)
  });
  return this.http.post('/_/send_message/', params);
};

MultiplayController.prototype.saveAndSyncMap = function() {  
  this.saveMap().
      success(angular.bind(this, function(data) {
        var message = {
          resync: true
        };
        this.sendMessage(message);
      })).
      error(angular.bind(this, function() {
      }));
};

MultiplayController.prototype.freezePlayers = function(freezed) {  
  var message = {
    freezed: freezed
  };
  this.sendMessage(message);
};

MultiplayController.prototype.onOpen = function() {  
  this.setupPing();
};

MultiplayController.prototype.onMessage = function(message) {  
  var data = angular.fromJson(message.data);
  var userId = data.user_id;
  var message = angular.fromJson(data.message);
  var blocks = message.blocks;
  var player = message.player;
  var freezed = message.freezed;
  var resync = message.resync;
  if (blocks) {
    for (var i = 0; i < blocks.length; i++) {
      this.game.setBlock(blocks[i].position, blocks[i].material);
    }
  }
  if (userId != this.initdata.user_id) {
    if (player) {
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
    if (typeof freezed == 'boolean') {
      this.freezed = freezed;
      this.scope.$apply();
    }
    if (typeof resync == 'boolean' && resync) {
      this.loadMap();
    }
  }
};

MultiplayController.prototype.setupPing = function() {
  this.game.on('tick', angular.bind(this, function() {
    var isMoved =
      Math.abs(this.avatar.position.x - this.prevPosition.x) +
      Math.abs(this.avatar.position.y - this.prevPosition.y) +
      Math.abs(this.avatar.position.z - this.prevPosition.z) > 0.5;
    var isRotated =
      Math.abs(this.avatar.rotation.y - this.prevRotation.y) > 0.3;
    if (!isMoved && !isRotated) {
      return;
    }
    this.prevPosition.x = this.avatar.position.x;
    this.prevPosition.y = this.avatar.position.y;
    this.prevPosition.z = this.avatar.position.z;

    this.prevRotation.x = this.avatar.rotation.x;
    this.prevRotation.y = this.avatar.rotation.y;
    this.prevRotation.z = this.avatar.rotation.z;

    var message = {
      player: {
        skin: this.skin,
        position: this.avatar.position,
        rotation: this.avatar.rotation,
        velocity: this.avatar.velocity
      }
    };
    this.sendMessage(message);
  }));
};

MultiplayController.prototype.onError = function(error) {  
  this.window.console.log('onError: ' + error);
};

MultiplayController.prototype.onClose = function() {  
  this.window.console.log('onClose');
  this.openSocket();
};

module.exports = MultiplayController;
