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
                ('project', 'Project'),
                ('waiting', 'Waiting'),
                ('someday', 'Someday/Maybe'),
                ('reference', 'Reference')
            ],default='next_action'),

            'ticket_priority': fields.Select(desc='Priority', choices=[
                ('5', 'Top'),
                ('4', 'High'),
                ('3', 'Normal'),
                ('2', 'Low'),
                ('1', 'Unimportant'),
            ],default='3'),
            'owner': models.mongodb.Relation(
                desc='Owner',
                model=models.core.Users.Users,
                resolve=False,
                list=False,
                check_exists=False),
            'allowed_groups': models.mongodb.Relation(
                desc='Groups with access',
                model=models.core.Groups.Groups,
                resolve=False,
                list=True,
                check_exists=False),
            'deligated_users': models.mongodb.Relation(
                desc='Deligated to',
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
        'owner': {
            'context_field': 'user_id',
            'check': True
        },
        'deligated_users': {
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
            change_title="{} changed task.".format(self.context.session['name'])
            change_text=""
            changed=False
        else:
            log_txt="Created new task {title}".format(**doc)
            change_title="{} created task.".format(self.context.session['name'])
            change_text=""
            changed=True

        self.info(log_txt)


        meta=self.meta.meta['meta'].meta['meta']


        def get_removed(lista,listb):
            if not isinstance(lista, list):
                lista=[]

            if not isinstance(listb, list):
                listb=[]

            removed=[]
            for a in lista:
                if not a in listb:
                    removed.append(a)

            return(removed)

        # print (old_doc)
        # print (ret)
        # print (get_removed(old_doc['deligated_users'], ret['deligated_users']))        

        diff=meta['deligated_users'].to_external(self.context, get_removed(old_doc['deligated_users'], ret['deligated_users']), resolve=True)
        for user in diff:
            change_text+="Removed {name} from task.\n".format(**user)

        diff=meta['deligated_users'].to_external(self.context, get_removed( ret['deligated_users'],old_doc['deligated_users']), resolve=True)
        for user in diff:
            change_text+="Deligated task to {name}.\n".format(**user)


        diff=meta['allowed_groups'].to_external(self.context, get_removed(old_doc['allowed_groups'], ret['allowed_groups']), resolve=True)
        for user in diff:
            change_text+="Removed group {name} from task.\n".format(**user)

        diff=meta['allowed_groups'].to_external(self.context, get_removed( ret['allowed_groups'],old_doc['allowed_groups']), resolve=True)
        for user in diff:
            change_text+="Added group {name} to task.\n".format(**user)

        if old_doc['owner']!=ret['owner']:
            changed_text+="Changed task owner from {name} to {name}"
            meta['owner'].to_external(self.context, old_doc['owner', resolve=True)

        # old_data=meta[key].to_external(self.context, old_doc[key], resolve=True)
        # new_data=meta[key].to_external(self.context, ret[key], resolve=True)
                    
        changed=True
        # for key in ret.keys():
        #     if key in old_doc and old_doc[key]!=ret[key]:
        #         if 'desc' in meta[key].meta:
        #             old_data=meta[key].to_external(self.context, old_doc[key], resolve=True)
        #             new_data=meta[key].to_external(self.context, ret[key], resolve=True)
        #             change_text+="Changed '{}' from '{}' to '{}'\n\n".format(meta[key].meta['desc'], old_data, new_data)
        #             changed=True

        if changed:
            #import here to prevent circular trouble
            import models.ticket.TicketObjects
            ticket_objects=models.ticket.TicketObjects.TicketObjects(self.context)
            ticket_objects.put(
                    type= 'change',
                    create_time=time.time(),
                    title=change_title,
                    text=change_text,
                    allowed_users=[ self.context.session['user_id'] ],
                    tickets=[ ret['_id'] ]
                )

        return(ret)

    @Acl(roles="user")
    def get(self, _id, **kwargs):
        return(self._get(_id,**kwargs))

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
