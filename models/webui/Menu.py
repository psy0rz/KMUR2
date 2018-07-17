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
                    menus[name]['menu']=name
                else:
                    #update existing menu
                    if 'title' in menudata:
                      menus[name]['title'] = menudata['title']
                    if 'pos' in menudata:
                      menus[name]['pos'] = menudata['pos']
                    if 'items' in menudata:
                      menus[name]['items'].extend(menudata['items'])
                    if 'view' in menudata:
                      menus[name]['view']=menudata['view']
    return menus

static_menus = loadmenus()


class Menu(models.mongodb.Base):
    '''Manages menu items and favorites for webui interface'''

    meta = fields.List(fields.Dict({
      'title': fields.String(),
      'items': fields.List(fields.Dict({
                                'title': fields.String(),
                                'view': fields.Anything({'desc': 'View parameters'}),
                                })),
      'favorites': fields.List(fields.Dict({
                                      'title': fields.String(),
                                      'view': fields.Anything({'desc': 'View parameters'}),
                                  }),
                                  list_key='_id'
                              ),
      }))

    @RPC(roles="user")
    def put_favorite(self, menu, title, view, favorite_id=None):
        '''add/update a menu item to in the favorites of this user. '''


        #add /update favorite item in database:
        self.db[self.default_collection].update(
                                                spec={
                                                      'user_id': self.context.session['user_id'],
                                                      'menu': menu,
                                                      'favorite_id': favorite_id,
                                                      'view.name' : view['name'],
                                                      },
                                                document={'$set': {
                                                                   'user_id': self.context.session['user_id'],
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
                                                          'user_id': self.context.session['user_id'],
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


    @RPC(roles="user")
    def delete_favorite(self, menu, favorite_id=None):
        '''delete a menu item from the favorites of this user. '''

        #delete item from favorite db
        self.db[self.default_collection].remove(
                                                spec_or_id={
                                                      'user_id': self.context.session['user_id'],
                                                      'menu': menu,
                                                      'favorite_id': favorite_id
                                                      },
                                                safe=True
                                                )

    @RPC(roles="everyone")
    def get_favorites(self):
        '''gets the favorites of this user

        note: not formatted as defined in get_meta
        '''

        return(self.db[self.default_collection].find(
          filter={ 
            'user_id': self.context.session['user_id'],
          },
          sort=[ ( 'title',1 ) ]
        ));



    @RPC(roles="everyone")
    def get_static(self):
        '''gets the static menu items

        note: not formatted as defined in get_meta
        '''
        return static_menus

    @RPC(roles="everyone")
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
                                                             '_id': favorite['_id'],
                                                             'title': favorite['title'],
                                                             'view': favorite['view']
                                                             })

        menu_list=list(menus.values())
        def get_key(a):
          return(a["pos"])
        menu_list.sort(key=get_key)

        return(menu_list)
