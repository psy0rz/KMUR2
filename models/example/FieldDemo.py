from models.common import *
import fields
import models.mongodb


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
                        'numberTest': fields.Number(desc='Whole number test'),
                        'decimalTest': fields.Number(desc='Number with 2 decimals', decimals=2),
                        'timestampTest': fields.Number(desc='Timestamp test'),
                            }

    allFields = {
              '_id': models.mongodb.FieldId(desc='Document ID'),
             'listTest': fields.ListDict(desc="List containing a Dict with the primitive fields",
                                         meta=primitiveFields),
              'dictTest': fields.Dict(desc="A sub-Dict containing the primitive fields again",
                                      meta=primitiveFields),
              }

    # print allFields['listTest']

    #add primitive fields to allFields as well
    allFields.update(primitiveFields)

    #now create the root dict with everything in it:
    meta = fields.Dict(allFields)

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

        self._delete(_id)

        self.info("Deleted demo row {}".format(doc['stringTest']))

    @Acl(groups="admin")
    def get_all(self, **params):
        '''get all test documents from database'''
        #NOTE: dont forget to explicitly set collection to None!
        #otherwise the user can look in every collection!
        return(self._get_all(collection=None, **params))
