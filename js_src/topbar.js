'use strict';

var Topbar = function() {
  var elem = $('#topbar');
  return {
    show_message: function(msg) {
      elem.text(msg);
      elem.removeClass('hide');
      elem.removeClass('error');
    },

    show_error: function(msg) {
      elem.text(msg);
      elem.removeClass('hide');
      elem.addClass('error');
    },

    hide_message: function() {
      elem.text('');
      elem.addClass('hide');
    }
  };
};


module.exports = Topbar;
