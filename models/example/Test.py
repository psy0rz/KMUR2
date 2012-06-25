from models.common import *
import fields
import models.mongodb


class Test(models.mongodb.MongoDB):
    '''example class to test all data types'''

    primitiveFields = {
                        'stringTest': fields.String(desc="String test"),
                        'multiselectTest': fields.MultiSelect(desc="Multi select test",
                                                              choices={
                                                              "first": "First choice",
                                                              "second": "Second choice",
                                                              "": "Empty string",
                                                              1: "Number 1",
                                                              2: "Number 2",
                                                              None: "Null choice"
                                                            }),
                        'selectTest': fields.Select(desc="Select test",
                                                              choices={
                                                              "first": "First choice",
                                                              "second": "Second choice",
                                                              "": "Empty string choice",
                                                              1: "Number 1 choice",
                                                              2: "Number 2 choice",
                                                              None:"Null/None choice"
                                                            }),
                        'passwordTest': fields.Password(desc="Password test"),
                        'booleanTest': fields.Bool(desc='Boolean test'),
                        'numberTest': fields.Number(desc='Whole number test'),
                        'decimalTest': fields.Number(desc='Number with 2 decimals', decimals=2),
                        'timestampTest': fields.Number(desc='Timestamp test'),
                            }

    allFields = {
              '_id': models.mongodb.FieldId(desc='Document ID'),
              'listTest': fields.List(desc="List containing a Dict with the primitive fields",
                                      meta=fields.Dict(primitiveFields)
                                      ),
              'dictTest': fields.Dict(desc="A sub-Dict containing the primitive fields again",
                                      meta=primitiveFields),
              }

    #add primitive fields to allFields as well
    allFields.update(primitiveFields)

    #now create the root dict with everything in it:
    meta = fields.Dict(allFields)

    @Acl(groups="admin")
    def put(self, **doc):
        '''put document in the test database

        call get_meta to see which fields you can set'''
        return(self._put("test", doc))

    @Acl(groups="admin")
    def get(self, _id):
        '''get _id from test database'''
        return(self._get("test", _id))

    @Acl(groups="admin")
    def delete(self, _id):
        '''delete _id from test database'''
        return(self._delete("test", _id))

    @Acl(groups="admin")
    def get_all(self, **params):
        '''get all test documents from database'''
        return(self._get_all("test", **params))
