from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.ticket.Relations
import models.mongodb

class TicketObjects(models.core.Protected.Protected):
    '''ticket objects belonging to specific tickets'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'create_time': fields.Timestamp(desc='Creation time'),
                'title': fields.String(min=3, desc='Title'),
                'text': fields.String(desc='Text'),
                'type': fields.Select(desc='Type', choices={
                    'phone': 'Phone call',
                    'email': 'Email',
                    'note': 'Note',
                    'work': 'Work done',
                    'change': 'Change to ticket status',
                    'doc': 'Document'
                }),
                'from': fields.String(desc='From'),
                'to': fields.String(desc='To'),
                'billing_relation': models.mongodb.Relation(
                    desc='Billing relation',
                    model=models.ticket.Relations.Relations,
                    check_exists=False,
                    resolve=False,
                    list=False),
                'allowed_groups': models.mongodb.Relation(
                    desc='Groups with access',
                    model=models.core.Groups.Groups,
                    check_exists=False,
                    resolve=False,
                    list=True),
                'allowed_users': models.mongodb.Relation(
                    desc='Users with access',
                    model=models.core.Users.Users,
                    check_exists=False,
                    resolve=False,
                    list=True),
                'tickets': models.mongodb.Relation(
                    desc='Tickets',
                    model=models.ticket.Tickets.Tickets,
                    check_exists=False,
                    resolve=False,
                    list=True),
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


    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed ticket item {title}".format(**doc)
        else:
          log_txt="Created new ticket item {title}".format(**doc)

        ret=self._put(doc)

        self.info(log_txt)

        return(ret)

    @Acl(roles="admin")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted ticket item {title}".format(**doc))

        return(ret)

    @Acl(roles="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

