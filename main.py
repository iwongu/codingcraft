"""Codingcraft server."""

from google.appengine.api import channel
from google.appengine.api import users
from google.appengine.ext import ndb

import data
import jinja2
import os
import urllib
import webapp2


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)


class MainPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        template_values = {
            'username': user.nickname(), }
        template = JINJA_ENVIRONMENT.get_template('index.html')
        self.response.write(template.render(template_values))


class MultiplayPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        key = self.request.get('key');
        result = data.Map.get_by_id(long(key))
        if result is None:
            self.error(404)
            self.response.out.write('Game not found.')
            return

        # if result.owner != user:
        #     self.error(404)
        #     self.response.out.write('You have to be an owner to start multiplay using this map.')
        #     return

        # token = channel.create_channel(user.user_id() + key)
        token = channel.create_channel(result.owner.user_id() + key)
        template_values = {
            'username': user.nickname(),
            'user_id': user.user_id(),
            'key': key,
            'channel_token': token
            }
        template = JINJA_ENVIRONMENT.get_template('multiplay.html')
        self.response.write(template.render(template_values))


application = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/start', MultiplayPage),
], debug=True)
