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
  if (this.game.getBlock([x, y, z]) != 0) { return; }
  this.setBlock_(x, y, z, block);
};

GameApi.prototype.removeBlock = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return; }
  this.setBlock_(x, y, z, 0);
};

GameApi.prototype.setBlock_ = function(x, y, z, block) {
  if (this.game.canCreateBlock([x, y, z])) {
    this.game.setBlock([x, y, z], block);
  }
};

GameApi.prototype.getBlock = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return 0; }
  return this.game.getBlock([x, y, z]);
};

GameApi.prototype.getCurrentBlock = function() {
  return this.gameController.currentMaterial + 1;
};

GameApi.prototype.getNormalVector = function() {
  var vec = this.gameController.getNormalVector();
  return {x: vec[0], y: vec[1], z: vec[2]};
};

GameApi.prototype.move = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return; }
  this.gameController.avatar.move(x, y, z);
};

GameApi.prototype.moveTo = function(x, y, z) {
  if (!this.isIn(x, y, z)) { return; }
  this.gameController.avatar.moveTo(x, y, z);
};

GameApi.prototype.getTargetPosition = function() {
  var pos = this.gameController.blockPosPlace ?
    this.gameController.blockPosPlace : this.gameController.blockPosErase;
  return pos != null ? {x: pos[0], y: pos[1], z: pos[2]} : null;
};

GameApi.prototype.isIn = function(x, y, z) {
  return this.gameController.isInGame(x, y, z);
};

module.exports = GameApi;
