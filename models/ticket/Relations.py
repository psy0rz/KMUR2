from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb
import models.ticket.Contracts
import bottle

class Relations(models.core.Protected.Protected):
    '''Real-life relations (these can be customers/companies or other contacts)

    dont confuse this with mongodb-relations :)
    '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'title': fields.String(min=3, desc='Title', size=100),
                'import_id': fields.String(desc='Import ID'),
                'desc': fields.String(desc='Description'),
                'allowed_groups': models.mongodb.Relation(
                    desc='Groups with access',
                    model=models.core.Groups.Groups,
                    resolve=False,
                    check_exists=False,
                    list=True),
                'allowed_users': models.mongodb.Relation(
                    desc='Users with access',
                    model=models.core.Users.Users,
                    resolve=False,
                    check_exists=False,
                    list=True),
                'contracts': models.mongodb.Relation(
                    desc='Contracts',
                    model=models.ticket.Contracts.Contracts,
                    resolve=False,
                    check_exists=True,
                    list=True),
                'emails': fields.List(
                    fields.Dict({
                            'desc': fields.String(desc='Description'),
                            'email': fields.Email(desc='Email address')
                        }),
                    desc="Email adresses"
                ),
                'phones': fields.List(
                    fields.Dict({
                            'desc': fields.String(desc='Description'),
                            'phone': fields.Phone(desc='Phone number')
                        }),
                    desc="Phone numbers"
                ),

                'address': fields.String(desc='Address'),
                'zip_code': fields.String(desc='ZIP code'),
                'city': fields.String(desc='City'),
                'province': fields.String(desc='Province/state'),
                'country': fields.String(desc='Country'),
                #a copy of this info is stored with every invoice
                'invoice': fields.Dict({
                    'customer_nr': fields.String(desc='Customer nr'),
                    'company': fields.String(desc='Company name'),
                    'department': fields.String(desc='Department'),
                    'address': fields.String(desc='Address'),
                    'zip_code': fields.String(desc='ZIP code'),
                    'city': fields.String(desc='City'),
                    'province': fields.String(desc='Province/state'),
                    'country': fields.String(desc='Country'),
                    'vat_nr': fields.String(desc='VAT identification number'),
                    'coc_nr': fields.String(desc='Chamber of commerce number'),
                    'iban_nr': fields.String(desc='Bank IBAN'),
                    'bic_code': fields.String(desc='BIC Code'),
                    'tax': fields.Number(desc='Tax %', default='21', min=0, max=100),
                    'mail_to': fields.Email(desc='Mail to', required=False),

                    'print': fields.Bool(desc='Send hardcopy'),

                },
                desc='Billing information')
            }),
            list_key='_id'
        )

    write={
        'allowed_groups': {
            'context_field': 'group_ids',
            'check': True
        },
        'allowed_users': {
            'context_field': 'user_id',
            'check': True
        },
    }

    read=write

    admin_read_roles= [ "finance_admin" ]


    @RPC(roles="ticket_write")
    def put(self, **doc):

        if 'customer_nr' in doc['invoice']:
            raise FieldError("cant change this field")
    
        if '_id' in doc:
            old_doc=self.get(_id=doc['_id'])
            if not 'customer_nr' in old_doc['invoice']:
                doc['invoice']['customer_nr']=str(self.get_next_nr())
            else:
                doc['invoice']['customer_nr']=old_doc['invoice']['customer_nr']
            log_txt="Changed relation {title}".format(**doc)
        else:
            log_txt="Created new relation {title}".format(**doc)
            doc['invoice']['customer_nr']=str(self.get_next_nr())

        ret=self._put(doc)
        self.event("changed",ret)

        self.info(log_txt)

        return(ret)

    @RPC(roles="user")
    def get(self, *args, **kwargs):
        return(self._get(*args, **kwargs))

    @RPC(roles="ticket_write")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted relation {title}".format(**doc))

        return(ret)

    @RPC(roles="user")
    def get_all(self, **params):
        return(self._get_all(**params))


    @RPC(roles="user")
    def get_all_csv(self):

        csv_data=""
        relations=self.get_all()

        for relation in relations:
            csv_data+=";".join([
                    relation["invoice"]["customer_nr"],
                    relation["invoice"]["company"].replace(";","_"),
                    relation["title"].replace(";","_"),
                ])
            csv_data+="\n"

        response=bottle.HTTPResponse(body=csv_data)
        response.set_header('Content-Type', 'text/plain')

        return(response)
        