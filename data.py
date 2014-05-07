from google.appengine.ext import ndb


class Blocks(ndb.Model):
    owner = ndb.UserProperty()
    authors = ndb.StringProperty(repeated=True)
    name = ndb.StringProperty()
    created = ndb.DateTimeProperty()
    updated = ndb.DateTimeProperty()
    data = ndb.TextProperty()


class User(ndb.Model):
    user = ndb.UserProperty()
    name = ndb.StringProperty()
