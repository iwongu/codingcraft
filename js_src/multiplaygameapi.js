'use strict'

var GameApi = require('./gameapi');
var inherits = require('inherits')

var MultiplayGameApi = function(gameController) {
  GameApi.call(this, gameController);
  this.blocks = [];
};
inherits(MultiplayGameApi, GameApi);

MultiplayGameApi.prototype.getBlocks = function() {
  return this.blocks;
};

MultiplayGameApi.prototype.setBlock_ = function(x, y, z, block) {
  this.blocks.push({
    position: [x, y, z],
    material: block
  });
};


module.exports = MultiplayGameApi;
