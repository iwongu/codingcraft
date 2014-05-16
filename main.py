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


def isUserSetup(user):
    result = data.User.query(data.User.user == user).fetch()
    if len(result) == 0:
        return False
    return result[0].name != None and result[0].avatar != None


class PlayPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if not isUserSetup(user):
            self.redirect('/user')
            return

        template_values = {
            'username': user.nickname(),
            'key': self.request.get('key')
            }
        template = JINJA_ENVIRONMENT.get_template('play.html')
        self.response.write(template.render(template_values))


class UserPage(webapp2.RequestHandler):
    def get(self):
        avatars = {
            'player': 'Max',
            'viking': 'Viking',
            'steve': 'Steve',
            'steve_girl': 'Steve - girl',
            'steve_adventurer': 'Steve - adventurer',
            'steve_suit': 'Steve - suit',
            'diamond_armor_steve': 'Steve - diamond armor'
            }
        user = users.get_current_user()
        template_values = {
            'username': user.nickname(),
            'avatars': avatars
            }
        template = JINJA_ENVIRONMENT.get_template('user.html')
        self.response.write(template.render(template_values))


class MultiplayPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if not isUserSetup(user):
            self.redirect('/user')
            return

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
            'map_owner_id': result.owner.user_id(),
            'key': key,
            'channel_token': token,
            'is_owner': result.owner == user
            }
        template = JINJA_ENVIRONMENT.get_template('multiplay.html')
        self.response.write(template.render(template_values))


application = webapp2.WSGIApplication([
    ('/', UserPage),
    ('/play', PlayPage),
    ('/start', MultiplayPage),
], debug=True)
