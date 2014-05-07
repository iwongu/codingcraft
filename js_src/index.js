'use strict'


var createGame = require('voxel-engine')
var highlight = require('voxel-highlight')
var player = require('voxel-player')
var voxel = require('voxel')
var extend = require('extend')
var fly = require('voxel-fly')
var walk = require('voxel-walk')

var GameController = function($scope) {
  this.scope = $scope;

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
    generate: function(i,j,k) {
      if (j > 0) { return 0; }
      if ((i*i + j*j + k*k) < 15*15) {
        return j == 0 ? 1 : 3;
      }
      return 0;
    },
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

  window.game = this; // for debugging

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
};

GameController.prototype.setup = function() {  
  var makeFly = fly(this.game);
  var target = this.game.controls.target();
  this.game.flyer = makeFly(target);
  
  // highlight blocks when you look at them, hold <Ctrl> for block placement
  var blockPosPlace, blockPosErase;
  var hl = this.game.highlighter = highlight(this.game, {color: 0xff0000, distance: 8});
  hl.on('highlight', function (voxelPos) { blockPosErase = voxelPos });
  hl.on('remove', function (voxelPos) { blockPosErase = null });
  hl.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos });
  hl.on('remove-adjacent', function (voxelPos) { blockPosPlace = null });

  // toggle between first and third person modes
  window.addEventListener('keydown', angular.bind(this, function (ev) {
    if (ev.keyCode === 'R'.charCodeAt(0)) {
      this.avatar.toggle();
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
    var position = blockPosPlace;
    if (position) {
      this.game.createBlock(position, this.currentMaterial + 1);
    }
    else {
      position = blockPosErase;
      if (position) this.game.setBlock(position, 0);
    }
  }));

  this.game.on('tick', angular.bind(this, function() {
    walk.render(target.playerSkin);
    var vx = Math.abs(target.velocity.x);
    var vz = Math.abs(target.velocity.z);
    if (vx > 0.001 || vz > 0.001) walk.stopWalking();
    else walk.startWalking();
  }));

  this.game.interact.on('attain', angular.bind(this, function() {
    this.hideCover = true;
    this.scope.$apply();
  }));
  this.game.interact.on('release', angular.bind(this, function() {
    this.hideCover = false;
    this.scope.$apply();
  }));
};


var ccApp = angular.module('cc', []);

ccApp.controller('GameController', GameController);

