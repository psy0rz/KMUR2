from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.ticket.Relations
import models.ticket.Tickets
import models.ticket.Contracts
import models.mongodb
import time

class TicketObjects(models.core.Protected.Protected):
    '''ticket objects belonging to specific tickets'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'create_time': fields.Timestamp(desc='Created at'),
                'start_time': fields.Timestamp(desc='Start time'),
                'end_time': fields.Timestamp(desc='End time'),
                'minutes': fields.Number(desc='Billable minutes',default=0, size=10),
                'title': fields.String(min=3, desc='Title', size=100),
                'text': fields.String(desc='Text'),
                'type': fields.Select(desc='Type', choices=[
                    ('phone', 'Phone call'),
                    ('email', 'Email'),
                    ('note', 'Note'),
                    ('time', 'Time'),
                    ('change', 'Task update'),
                    ('doc', 'Document')
                ], default='note'),
                'from': fields.String(desc='From'),
                'to': fields.String(desc='To'),
                'billing_relation': models.mongodb.Relation(
                    desc='Billing relation',
                    model=models.ticket.Relations.Relations,
                    check_exists=False,
                    resolve=False,
                    list=False),
                'billing_contract': models.mongodb.Relation(
                    desc='Billing contract',
                    model=models.ticket.Contracts.Contracts,
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
                    desc='Tasks this note belongs to',
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


    @Acl(roles="user")
    def put(self, **doc):

        #only accept billing info if both fields are specified (to prevent fraud by changing only one):         
        if ('billing_contract' in doc)  ^  ('billing_relation' in doc):
            raise fields.FieldError("Please specify complete billing information", 'billing_contract')

        #verify billing contract is allowed for this relation
        if 'billing_contract' in doc:
            relation=call_rpc(self.context, 'ticket', 'Relations', 'get', doc['billing_relation'])
            if doc['billing_contract'] not in relation['contracts']:
                raise fields.FieldError("Relation doesnt have this contract", 'billing_contract')


        if '_id' in doc:
          log_txt="Changed task note '{title}'".format(**doc)
          # if 'create_time' in doc:
          #   del doc['create_time']            
        else:
          log_txt="Created new task note 'title'".format(**doc)
          # doc['create_time']=time.time()

        ret=self._put(doc)

        self.event("changed", ret)

        if ret['type']!='change':
            self.info(log_txt)

        return(ret)

    @Acl(roles="user")
    def get(self, _id):

        #read the object unprotected
        ticket_object=super(models.core.Protected.Protected, self)._get(_id)

        #do we have access to at least one of the ticket the object belongs to?
        if len(ticket_object['tickets'])>0:
            ticket_model=models.ticket.Tickets.Tickets(self.context)
            tickets=ticket_model.get_all(match_in={
                    '_id': ticket_object['tickets']
                })

            if len(tickets)>0:
                return(ticket_object)


        return(self._get(_id))

    @Acl(roles="user")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.event("deleted", ret)
        self.info("Deleted ticket item {title}".format(**doc))

        return(ret)

    @Acl(roles="user")
    def get_all(self, **params):
        ticket_objects=self._get_all(**params)


        return(ticket_objects)

    @Acl(roles="user")
    def get_all_by_ticket(self, ticket_id, **params):
        #make sure we have access to the ticket
        ticket_model=models.ticket.Tickets.Tickets(self.context)
        ticket_model.get(ticket_id)
        
        #call the 'unprotected' get_all but make sure it only returns objects that belong to this the ticket
        ticket_objects=super(models.core.Protected.Protected, self)._get_all(match_in={
             'tickets': [ ticket_id ]
            },
            **params)


        return(ticket_objects)
