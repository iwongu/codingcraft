from google.appengine.api import users

import data
import datetime
import json
import webapp2


class SaveMap(webapp2.RequestHandler):
    def post(self):
        user = users.get_current_user()
        result = data.Map.query(data.Map.owner == user).fetch()
        blocks = None
        if len(result) > 0:
            blocks = result[0]
        if blocks is None:
            blocks = data.Map()
            blocks.created = datetime.datetime.now()
            blocks.owner = user

        blocks.data = self.request.get('data')
        blocks.updated = datetime.datetime.now()
        key = blocks.put()

        response = {'result': 'ok', 'key': key.id() }
        self.response.write(json.dumps(response))


class LoadMap(webapp2.RequestHandler):
    def post(self):
        user = users.get_current_user()
        result = data.Map.query(data.Map.owner == user).fetch()
        if len(result) == 0:
            response = {'result': 'not_found' }
            self.response.write(json.dumps(response))
            return

        blocks = result[0]
        response = {
            'result': 'ok',
            'key': blocks.key.id(),
            'data': blocks.data }
        self.response.write(json.dumps(response));


class SaveCodes(webapp2.RequestHandler):
    def post(self):
        user = users.get_current_user()
        result = data.User.query(data.User.user == user).fetch()
        currentUser = None
        if len(result) > 0:
            currentUser = result[0]
        if currentUser is None:
            currentUser = data.User()
            currentUser.user = user

        currentUser.codes = self.request.get_all('codes[]')
        key = currentUser.put()

        response = {'result': 'ok', 'key': key.id() }
        self.response.write(json.dumps(response))


class LoadCodes(webapp2.RequestHandler):
    def post(self):
        user = users.get_current_user()
        result = data.User.query(data.User.user == user).fetch()

        if len(result) == 0:
            response = {'result': 'not_found' }
            self.response.write(json.dumps(response))
            return

        currentUser = result[0]

        response = {
            'result': 'ok',
            'key': currentUser.key.id(),
            'codes': currentUser.codes }
        self.response.write(json.dumps(response));


application = webapp2.WSGIApplication([
        ('/_/save_map/', SaveMap),
        ('/_/load_map/', LoadMap),
        ('/_/save_codes/', SaveCodes),
        ('/_/load_codes/', LoadCodes),
    ], debug=True)
