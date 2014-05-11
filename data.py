from google.appengine.ext import ndb


class Map(ndb.Model):
    owner = ndb.UserProperty()
    authors = ndb.StringProperty(repeated=True)
    name = ndb.StringProperty()
    created = ndb.DateTimeProperty()
    updated = ndb.DateTimeProperty()
    version = ndb.StringProperty()
    data = ndb.TextProperty()


class User(ndb.Model):
    user = ndb.UserProperty()
    name = ndb.StringProperty()
    codes = ndb.TextProperty(repeated=True)
