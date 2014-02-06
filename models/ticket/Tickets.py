from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.ticket.Relations
import models.mongodb

class Tickets(models.core.Protected.Protected):
    '''ticket system'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'title': fields.String(min=3, desc='Task', size=100),
                'desc': fields.String(desc='Description'),
                'start_date': fields.Timestamp(desc='Start date'),
                'due_date': fields.Timestamp(desc='Due date'),
                'completed': fields.Bool(desc='Completed'),
                'status': fields.Select(desc='Status', choices=[
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
                    check_exists=False),
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


        ret=self._put(doc)

        if '_id' in doc:
            #support edits in place that only put small documents
            doc=self._get(doc['_id'])
            log_txt="Changed task {title}".format(**doc)
        else:
            log_txt="Created new task {title}".format(**doc)

        self.info(log_txt)

        return(ret)

    @Acl(roles="user")
    def get(self, **kwargs):
        return(self._get(**kwargs))

    @Acl(roles="user")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted task {title}".format(**doc))

        return(ret)

    @Acl(roles="user")
    def get_all(self, **params):
        return(self._get_all(**params))

