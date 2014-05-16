from google.appengine.ext import ndb


class Map(ndb.Model):
    owner = ndb.UserProperty()
    authors = ndb.StringProperty(repeated=True)
    name = ndb.StringProperty()
    created = ndb.DateTimeProperty()
    updated = ndb.DateTimeProperty()
    version = ndb.StringProperty()
    data = ndb.TextProperty()

    def serialize(self):
        return {
            'key': self.key.id(),
            'name': self.name if self.name is not None else '(no name)',
            'created': self.created.strftime('%d %b %Y %H:%M'),
            'updated': self.updated.strftime('%d %b %Y %H:%M'),
            }



class User(ndb.Model):
    user = ndb.UserProperty()
    name = ndb.StringProperty()
    avatar = ndb.StringProperty()
    codes = ndb.TextProperty(repeated=True)
