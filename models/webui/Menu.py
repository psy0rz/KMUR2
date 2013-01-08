from models.common import *
import fields
import models.mongodb

import json
import glob
import time
import copy


def loadmenus():
    '''load menus by loading the menu.json files from every view class'''
    menus = {}
    for menufile in glob.glob("static/views/*/*/menu.json"):
        with open(menufile) as f:
            menudef = json.load(f)
            for (name, menudata) in list(menudef.items()):
                if not name in menus:
                    menus[name] = menudata
                    #just add this for developer convienience. (otherwise its hard to figure out which menu to specify in add_favorites)
                    menus[name]['menu']=name
                else:
                    #update existing menu
                    menus[name]['title'] = menudata['title']
                    menus[name]['items'].extend(menudata['items'])
    return menus

static_menus = loadmenus()


class Menu(models.mongodb.MongoDB):
    '''Manages menu items and favorites for webui interface'''

    meta = fields.Dict({
                        'main':fields.ListDict({
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
                        })
                          
    @Acl(groups="user")
    def add_favorite(self, menu, title, view, favorite_id=None):
        '''add a menu item to the favorites of this user. '''

        if not favorite_id:
            favorite_id = view['params']['_id']

        #add /update favorite item in database:
        self.db[self.default_collection].update(
                                                spec={
                                                      'user_id': self.context.user_id,
                                                      'menu': menu,
                                                      'favorite_id': favorite_id
                                                      },
                                                document={'$set': {
                                                                   'user_id': self.context.user_id,
                                                                   'menu': menu,
                                                                   'title': title,
                                                                   'view': view,
                                                                   'favorite_id': favorite_id,
                                                                   'time': time.time(),
                                                                   }},
                                                upsert=True,
                                                safe=True
                                                )

        #get all items for this menu and user
        favorites = self.db[self.default_collection].find(
                                                          {
                                                          'user_id': self.context.user_id,
                                                          'menu': menu
                                                          },
                                                          sort=[('time', 1)]
                                                          )

        #limit the number of items 
        count = favorites.count()
        for favorite in favorites:
            if count < 10:
                break

            self._delete(favorite['_id'])
            count = count - 1

    @Acl(groups="everyone")
    def get_favorites(self):
        '''gets the favorites of this user

        note: not formatted as defined in get_meta
        '''
        return self._get_all(spec={
                                    'user_id': self.context.user_id
                                    },
                             sort={
                                   'time':-1
                                   })

    @Acl(groups="everyone")
    def get_static(self):
        '''gets the static menu items

        note: not formatted as defined in get_meta
        '''
        return static_menus

    @Acl(groups="everyone")
    def get(self):
        '''gets the static and favorite items of this user in a format that fits nicely in our menu view

        this is formatted according to get_meta
        '''

        favorites = self.get_favorites()
        menus = copy.deepcopy(self.get_static())

        for favorite in favorites:
            if favorite['menu'] in menus:
                if not 'favorites' in  menus[favorite['menu']]:
                    menus[favorite['menu']]['favorites'] = []
                menus[favorite['menu']]['favorites'].append({
                                                             'title': favorite['title'],
                                                             'view': favorite['view']
                                                             })

        return {
                'main': list(menus.values())
                }
