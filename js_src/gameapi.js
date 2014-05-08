'use strict'

var GameApi = function(gameController) {
  this.gameController = gameController;
  this.game = gameController.game;
  this.block = {};
  for (var i = 0; i < this.gameController.icons.length; i++) {
    this.block[this.gameController.icons[i]] = i + 1;
  }
};

GameApi.prototype.setBlock = function(position, block) {
  if (!this.isIn(position)) { return; }
  if (this.game.getBlock(position) != 0) { return; }
  this.game.setBlock(position, block);
};

GameApi.prototype.getBlock = function(position) {
  if (!this.isIn(position)) { return 0; }
  return this.game.getBlock([position]);
};

GameApi.prototype.removeBlock = function(position) {
  if (!this.isIn(position)) { return; }
  this.game.setBlock([position], 0);
};

GameApi.prototype.move = function(position) {
  if (!this.isIn(position)) { return; }
  this.gameController.avatar.move(position);
};

GameApi.prototype.moveTo = function(position) {
  if (!this.isIn(position)) { return; }
  this.gameController.avatar.moveTo(position);
};

GameApi.prototype.getTargetPosition = function() {
  return this.gameController.blockPosPlace ?
    this.gameController.blockPosPlace : this.gameController.blockPosErase;
};

GameApi.prototype.isIn = function(position) {
  for (var i = 0; i < position.length; i++) {
    if (Math.abs(position[i]) > this.gameController.gameSize) {
      return false;
    }
  }
  return true;
};

module.exports = GameApi;
