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

  this.setup();

  this.players = {};

  this.loadMap();
  this.loadCodes();
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
      position: [this.avatar.position.x, this.avatar.position.y, this.avatar.position.z]
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
  for (var i = 0; i < blocks.length; i++) {
    this.game.setBlock(blocks[i].position, blocks[i].material);
  }
  if (userId != this.initdata.user_id) {
    if (!this.players[userId]) {
      this.players[userId] = skin(this.game.THREE, 'images/player.png', this.skinOpts);
      this.game.scene.add(this.players[userId].mesh);
    }
    this.players[userId].mesh.position.x = message.position[0];
    this.players[userId].mesh.position.y = message.position[1];
    this.players[userId].mesh.position.z = message.position[2];
  }
};

MultiplayController.prototype.onError = function(error) {  
};

MultiplayController.prototype.onClose = function() {  
};

module.exports = MultiplayController;
