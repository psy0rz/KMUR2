from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.ticket.Relations
import models.mongodb
import time

class Tickets(models.core.Protected.Protected):
    '''ticket system'''

    meta = fields.List(
        fields.Dict({
            '_id': models.mongodb.FieldId(),
            'title': fields.String(min=3, desc='Task', size=100),
            'desc': fields.String(desc='Description'),
            'start_date': fields.Timestamp(desc='Start date'),
            'due_date': fields.Timestamp(desc='Due date'),
            'ticket_completed': fields.Bool(desc='Completed'),
            'ticket_status': fields.Select(desc='Status', choices=[
                ('none', 'None'),
                ('next_action', 'Next Action'),
                ('active', 'Active'),
                (None,'---'),
                ('planning', 'Planning'),
                ('deligated', 'Deligated'),
                ('waiting', 'Waiting'),
                ('hold', 'Hold'),
                ('postponed', 'Postponed'),
                ('someday', 'Someday'),
                ('cancelled', 'Cancelled'),
                ('reference', 'Reference')
            ],default='next_action'),

            'ticket_priority': fields.Select(desc='Priority', choices=[
                ('5', 'Top'),
                ('4', 'High'),
                ('3', 'Normal'),
                ('2', 'Low'),
                ('1', 'Unimportant'),
            ],default='3'),
            'allowed_groups': models.mongodb.Relation(
                desc='Groups with access',
                model=models.core.Groups.Groups,
                resolve=False,
                list=True,
                check_exists=False),
            'allowed_users': models.mongodb.Relation(
                desc='Users with access',
                model=models.core.Users.Users,
                resolve=False,
                list=True,
                check_exists=False),
            'relations': models.mongodb.Relation(
                desc='Related to',
                model=models.ticket.Relations.Relations,
                resolve=False,
                list=True,
                check_exists=False)
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

        old_doc={}
        if '_id' in doc:
            old_doc=self._get(doc['_id'])

        ret=self._put(doc)
        self.event("changed", ret)

        if '_id' in doc:
            #support edits in place that only put small documents
            log_txt="Changed task {title}".format(**old_doc)
        else:
            log_txt="Created new task {title}".format(**doc)

        self.info(log_txt)


        change_title=""
        change_text=""
        meta=self.meta.meta['meta'].meta['meta']
        for key in ret.keys():
            if key in old_doc and old_doc[key]!=ret[key]:
                if 'desc' in meta[key].meta:
                    if change_title=="":
                        change_title+="'{}'".format(meta[key].meta['desc'])
                    else:
                        change_title+=", '{}'".format(meta[key].meta['desc'])
                    change_text+="Changed '{}' from '{}' to '{}'\n\n".format(meta[key].meta['desc'], old_doc[key], ret[key])

        if change_title!="":
            #import here to prevent circular trouble
            import models.ticket.TicketObjects
            ticket_objects=models.ticket.TicketObjects.TicketObjects(self.context)
            ticket_objects.put(
                    type= 'change',
                    create_time=time.time(),
                    title="{} changed: {}".format(self.context.session['name'], change_title),
                    text=change_text,
                    allowed_groups=ret['allowed_groups'],
                    allowed_users=ret['allowed_users'],
                    tickets=[ ret['_id'] ]
                )

        return(ret)

    @Acl(roles="user")
    def get(self, **kwargs):
        return(self._get(**kwargs))

    @Acl(roles="user")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted task {title}".format(**doc))

        return(ret)

    @Acl(roles="user")
    def get_all(self, **params):
        return(self._get_all(**params))

#since this is recursive, we cant define it inside the Tickets class
Tickets.meta.meta['meta'].meta['meta']['tickets']=models.mongodb.Relation(
    desc='Tasks we depend on',
    model=Tickets,
    resolve=False,
    list=True,
    check_exists=False)
