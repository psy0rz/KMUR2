from models.common import *
import fields
import models.mongodb

import json
import glob


def loadmenus():
    '''load menus by loading the menu.json files in every view class'''
    menus = {}
    for menufile in glob.glob("static/views/*/*/menu.json"):
        with open(menufile) as f:
            menudef = json.load(f)
            for (name, menudata) in menudef.items():
                if not name in menus:
                    menus[name] = menudata
                else:
                    #update existing menu
                    menus[name]['title'] = menudata['title']
                    menus[name]['items'].extend(menudata['items'])
    return menus

staticmenus = loadmenus()


class Menu(models.mongodb.MongoDB):
    '''Manages menu items and favorites for webui interface'''

    meta = fields.ListDict({
                            'title': fields.String(),
                            'items': fields.ListDict({
                                                      'title': fields.String(),
                                                      'view': fields.Anything({'desc': 'View parameters'}),
                                                      }),
                            'favorites': fields.ListDict({
                                                      'title': fields.String(),
                                                          'view': fields.Anything({'desc': 'View parameters'}),
                                                          }),
                          })

    @Acl(groups="admin")
    def put(self, **doc):
        '''put document in the field_demo database

        call get_meta to see which fields you can set'''
        return(self._put(doc))

    @Acl(groups="user")
    def get(self):
        return staticmenus

    @Acl(groups="admin")
    def delete(self, _id):
        '''delete _id from test database'''
        return(self._delete(_id))

    @Acl(groups="admin")
    def get_all(self, **params):
        '''get all test documents from database'''
        #NOTE: dont forget to explicitly set collection to None!
        #otherwise the user can look in every collection!
        return(self._get_all(collection=None, **params))
