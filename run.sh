browserify ./js_src/game.js | uglifyjs > ./js/game_bundle.js
browserify ./js_src/multiplay.js | uglifyjs > ./js/multiplay_bundle.js
browserify ./js_src/user.js | uglifyjs > ./js/user_bundle.js
