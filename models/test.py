import type
import json

t=type.Dict({
            'poep':type.Number(min=0, max=100,decimals=2),
            'user':type.String(min=0, max=12),
            'pass':type.String(min=5, max=11),
            'subje':type.Dict({
                              'subuser':type.String(min=0, max=13),
                              'subpass':type.String(min=0, max=14)
                              }),
            'listje':type.List(type.String(min=0, max=13)),
            'listmetdicts':type.List(type.Dict({
                                                  'subuser':type.String(min=0, max=13),
                                                  'subpass':type.String(min=0, max=14)
                            
                                              })),
            
            })

class TypeEncoder(json.JSONEncoder):
    def default(self, o):
       if isinstance(o, type.Base):
           return(o.meta)
       else:
           return super().default(o)
    

print json.dumps(t, cls=TypeEncoder, indent=1)

d={
   'poep': 12.4,
   'user':"psff",
   'pass':"pffff",
   'subje':{
            'subuser':"ffffdddd"
            },
   'listje':["string1", "telangesgg", "string2"],
   'listmetdicts':[
                   {'subuser':"eerste", 'subpass':'eerstepass'},
                   {'subuser':"tweede", 'subpass':'twwffedepass'},
                   {'subuser':"derder", 'subpass':'eerstepass'},
                   ]
   }

try:
    t.check(d)
except type.TypeException as e:
    print e.message
    print e.fields
    

