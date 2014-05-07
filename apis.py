from google.appengine.api import users
from data import Blocks
import json
import webapp2


class SaveBlocks(webapp2.RequestHandler):
    def post(self):
        user = users.get_current_user()
        data = self.request.get('data')

        user = users.get_current_user()
        result = Blocks.query(Blocks.owner == user).fetch()
        blocks = None
        if len(result) > 0:
            blocks = result[0]
        if blocks is None:
            blocks = Blocks()
            blocks.owner = user

        blocks.data = data
        key = blocks.put()

        response = {'result': 'ok', 'key': key.id() }
        self.response.write(json.dumps(response))


class LoadBlocks(webapp2.RequestHandler):
    def post(self):
        user = users.get_current_user()
        result = Blocks.query(Blocks.owner == user).fetch()
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


application = webapp2.WSGIApplication([
        ('/_/save_blocks/', SaveBlocks),
        ('/_/load_blocks/', LoadBlocks),
    ], debug=True)
