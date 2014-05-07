'use strict'

var GameApi = function(gameController) {
  this.gameController = gameController;
  this.game = gameController.game;
  this.block = {};
  for (var i = 0; i < this.gameController.icons.length; i++) {
    this.block[this.gameController.icons[i]] = i + 1;
  }
};

GameApi.prototype.setBlock = function(x, y, z, block) {
  if (!this.isIn(x, y, z)) { return; }
  this.game.setBlock([x, y, z], block);
};

GameApi.prototype.getBlock = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return 0; }
  return this.game.getBlock([x, y, z]);
};

GameApi.prototype.removeBlock = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return; }
  this.game.setBlock([x, y, z], 0);
};

GameApi.prototype.move = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return; }
  this.gameController.avatar.move(x, y, z);
};

GameApi.prototype.moveTo = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return; }
  this.gameController.avatar.moveTo(x, y, z);
};

GameApi.prototype.isIn = function(x, y, z) {
  return Math.abs(x) <= this.gameController.gameSize &&
      Math.abs(y) <= this.gameController.gameSize &&
      Math.abs(z) <= this.gameController.gameSize;
};

module.exports = GameApi;
