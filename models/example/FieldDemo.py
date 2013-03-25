from models.common import *
import fields
import models.mongodb
import time


class FieldDemo(models.mongodb.MongoDB):
    '''example class to demonstrate and test all data types'''

    primitiveFields = {
                        'stringTest': fields.String(desc="String test",min=3),
                        'multiselectTest': fields.MultiSelect(desc="Multi select test",
                                                              choices={
                                                              "first": "First choice",
                                                              "second": "Second choice",
                                                              "": "Empty choice",
                                                            }),
                        'selectTest': fields.Select(desc="Select test",
                                                              choices={
                                                              "first": "First choice",
                                                              "second": "Second choice",
                                                              "": "Empty choice",
                                                            }),
                        'passwordTest': fields.Password(desc="Password test"),
                        'booleanTest': fields.Bool(desc='Boolean test'),
                        'numberIntTest': fields.Number(desc='Integer test (optional)', required=False),
                        'numberFloatTest': fields.Number(desc='Float test (2 dec.)', decimals=2),
                        'timestampTest': fields.Timestamp(desc='Timestamp test'),
                            }

    allFields = {
        '_id': models.mongodb.FieldId(desc='Document ID'),
        'listTest': fields.List(
            fields.Dict(primitiveFields),
            desc="List containing a Dict with the primitive fields"
        ),
        'dictTest': fields.Dict(
            primitiveFields,
            desc="A sub-Dict containing the primitive fields again"
        ),
    }

    # print allFields['listTest']

    #add primitive fields to allFields as well
    allFields.update(primitiveFields)

    #now create the root ListDict with everything in it:
    meta = fields.List(
        fields.Dict(allFields),
        list_key='_id',
        desc='the root list of this class, this metadata is usually not shown in the userinterface'
    )

    @Acl(groups="admin")
    def put(self, **doc):
        '''put document in the field_demo database

        call get_meta to see which fields you can set'''

        if '_id' in doc:
          logTxt="Changed demo row {}".format(doc['stringTest'])
        else:
          logTxt="Created demo row {}".format(doc['stringTest'])

        ret=self._put(doc)

        self.info(logTxt)

        return(ret)

    @Acl(groups="admin")
    def get(self, _id):
        '''get _id from test database'''
        return(self._get(_id))

    @Acl(groups="admin")
    def delete(self, _id):
        '''delete _id from test database'''

        #get document for better logging
        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted demo row {}".format(doc['stringTest']))

        return(ret)

    @Acl(groups="admin")
    def get_all(self, sleep=0, **params):
        '''get all test documents from database'''

        #artificial sleep to simulate slow results.
        if sleep:
            time.sleep(sleep)

        #NOTE: dont forget to explicitly set collection to None!
        #otherwise the user can look in every collection!
        return(self._get_all(collection=None, **params))

