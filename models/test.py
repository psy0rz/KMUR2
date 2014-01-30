import field
import json

t=field.Dict({
            'poep':field.Number(min=0, max=100,decimals=2,desc='jojojo'),
            'tijd':field.Timestamp(desc='hoe loat ist'),
            'user':field.String(min=0, max=12),
            'pass':field.Password(min=5, max=11),
            'sel':field.Select({
                               'eerste': 'eerste keus',
                               'tweede': 'tweede keus',
                               'derde': 'derde keus'
                               },
                              desc='select ding'),
            'msel':field.MultiSelect({
                               'eerste': 'eerste keus',
                               'tweede': 'tweede keus',
                               'derde': 'derde keus'
                               },
                              desc='multi select ding'),
            'subje':field.Dict({
                                  'subuser':field.String(min=0, max=13),
                                  'subpass':field.String(min=0, max=14)
                              },
                              ),
            'listje':field.List(field.String(min=0, max=13)),
            'listmetdicts':field.List(field.Dict({
                                                  'subuser':field.String(min=0, max=13),
                                                  'subpass':field.String(min=0, max=14)
                            
                                              })),
            
            },
            desc="blaaTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt",
            required=[]
            )

    

print(json.dumps(t, cls=field.JSONEncoder, indent=1))

d={
   'poep': 12.44,
   'user':"psff",
   'tijd': 32,
   'pass':"pffffffff",
   'subje':{
            'subuser':"ffffdddd"
            },
   'listje':["string1", "telangesgg", "string2"],
   'sel':'eerste',
   'msel':['eerste','tweede','derde'],
   'listmetdicts':[
                   {'subuser':"eerste", 'subpass':'eerstepass'},
                   {'subuser':"tweede", 'subpass':'twwffedepass'},
                   {'subuser':"derder", 'subpass':'eerstepass'},
                   ]
   }

try:
    t.check(d)
except field.FieldError as e:
    print(e.message)
    print(e.fields)
    


