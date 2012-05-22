import type
import json

t=type.Dict({
            'poep':type.Number(min=0, max=100,decimals=2,desc='jojojo'),
            'tijd':type.Timestamp(desc='hoe loat ist'),
            'user':type.String(min=0, max=12),
            'pass':type.Password(min=5, max=11),
            'subje':type.Dict({
                                  'subuser':type.String(min=0, max=13),
                                  'subpass':type.String(min=0, max=14)
                              },
                              ),
            'listje':type.List(type.String(min=0, max=13)),
            'listmetdicts':type.List(type.Dict({
                                                  'subuser':type.String(min=0, max=13),
                                                  'subpass':type.String(min=0, max=14)
                            
                                              })),
            
            },
            desc="blaaTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt",
            required=[]
            )

    

print json.dumps(t, cls=type.JSONEncoder, indent=1)

d={
   'poep': 12.44,
   'user':"psff",
   'tijd': 32,
   'pass':"pffffffff",
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
    


