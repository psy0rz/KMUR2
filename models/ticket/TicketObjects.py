from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.ticket.Relations
import models.ticket.Tickets
import models.ticket.Contracts
import models.ticket.ContractInvoices
import models.mongodb
import time
import hashlib
import os
import bottle
import bson.objectid

class TicketObjects(models.core.Protected.Protected):
    '''ticket objects belonging to specific tickets'''
    
    file_path="files/"
    thumb_path="static/files/" #publicly accesible thumbnails, local path
    thumb_url="/files/"        #public url path
    default_thumb_url="/icons/ticketobject_{}.png"

    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'create_time': fields.Timestamp(desc='Created at'),
                'start_time': fields.Timestamp(desc='Start time'),
                'end_time': fields.Timestamp(desc='End time'),
                'minutes': fields.Number(desc='Billable minutes', size=10),
                'minutes_factor': fields.Select(desc='Billing rate', choices=[
                    (0, '0%'),
                    (0.25, '25%'),
                    (0.5, '50%'),
                    (0.75, '75%'),
                    (1, '100%'),
                    (1.25, '125%'),
                    (1.50, '150%'),
                    (1.75, '175%'),
                    (2, '200%'),
                ], default=1),
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
                'billing_contract_invoice': models.mongodb.Relation(
                    desc='Billing order',
                    model=models.ticket.ContractInvoices.ContractInvoices,
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
                'file': fields.File(desc='File'),
                'file_content_type': fields.String(desc='File content type'),
                'thumbnail': fields.Image(desc='Thumbnail'),
                'import_id': fields.String(desc='Import ID'),
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


    def get_file_path(self, file_hash):
        return(self.file_path+file_hash)

    def get_thumb_path(self, file_hash):
        return(self.thumb_path+file_hash+".jpg")

    def get_thumb_url(self, file_hash):
        return(self.thumb_url+file_hash+".jpg")

    def get_file_url(self, ticket_object):
        return("/rpc/ticket/TicketObjects/download/"+ticket_object["_id"]+"/"+os.path.basename(ticket_object["title"]))

    def store_file(self, file_upload):
        """stores file in data-store and returns hash"""

        #hash the file
        file_hash=hashlib.sha256()
        file_upload.file.seek(0)
        while 1:
            buf=file_upload.file.read(65000)
            if not buf:
                break
            file_hash.update(buf)
        file_upload.file.seek(0)
        hash=file_hash.hexdigest()

        file_name=self.get_file_path(hash)

        #TODO: check for hash collision
        file_upload.save(file_name, overwrite=True)
        file_upload.file.close()

        return(hash)


    def process_file_image(self, doc):
        """processor for image content-type"""
        import wand.image
        image=wand.image.Image(filename=self.get_file_path(doc["file"]))

        #create jpg thumbnail
        new_width=200
        new_height=(image.height*new_width)//image.width
        image.resize(new_width, new_height)
        jpg_image=image.convert("jpg")
        image.close()
        jpg_image.save(filename=self.get_thumb_path(doc["file"]))
        doc["thumbnail"]=self.get_thumb_url(doc["file"])

        #call tesseract to do some OCR
        import subprocess
        import re
        try:
            ocr_text=subprocess.check_output(["tesseract", self.get_file_path(doc["file"]), "stdout", "-l", "nld+eng" ]).decode('utf-8')
            #get rid of double empty lines
            doc["text"]=""
            had_empty=True
            for line in ocr_text.split("\n"):
                #empty line? only add one, skip rest
                if re.match("^\s*$", line):
                    if not had_empty:
                        had_empty=True
                        doc["text"]+="\n"
                else:
                    had_empty=False
                    doc["text"]+=line+"\n"

            # keywords=list(set(ocr_text.split()))
            # keywords.sort()
            # doc["text"]+="\nKeywords:"+" ".join(keywords)


        except Exception as e:
            print("Error while calling tesseract:", str(e))

    def process_file(self, doc):
        """do some processing like generating thumbnails and doing OCR to create keywords, and getting metadata

        it should also be possible to do this offline at a later time

        later we should make this extendable for 3rd parties
        """

        #common stuff
        with open(self.get_file_path(doc["file"])) as file:
            doc["text"]="Filesize: {} bytes\n".format(file.seek(0, os.SEEK_END))


        #now call the appropriate handlers for this content-type
        (maintype, subtype)=doc["file_content_type"].lower().split("/")
        maintype=re.sub("[^a-z0-9]","_",maintype)
        subtype=re.sub("[^a-z0-9]","_",subtype)

        if hasattr(self, "process_file_"+maintype):
            method=getattr(self, "process_file_"+maintype)
            method(doc)

        if hasattr(self, "process_file_"+maintype+"_"+subtype):
            method=getattr(self, "process_file_"+maintype+"_"+subtype)
            method(doc)


    @Acl(roles="user")
    def put(self, file=None, update_contract_invoice=True, **doc):

        if file:
            hash=self.store_file(file)
            doc["file"]=hash
            doc["file_content_type"]=file.content_type
            doc["title"]=file.raw_filename

            #now do some magic on the file:
            self.process_file(doc)


        #only accept billing info if both fields are specified (to prevent fraud by changing only one):         
        if ('billing_contract' in doc)  or  ('billing_relation' in doc):
            if doc['billing_contract']==None or doc['billing_relation']==None:
                raise fields.FieldError("Please specify complete billing information", 'billing_contract')

        #verify the billing contract is allowed for this relation
        if 'billing_contract' in doc and doc['billing_contract']!=None and doc['billing_relation']!=None:
            relation=call_rpc(self.context, 'ticket', 'Relations', 'get', doc['billing_relation'])
            if doc['billing_contract'] not in relation['contracts']:
                raise fields.FieldError("Relation doesnt have this contract", 'billing_contract')


        if '_id' in doc:
            old_doc=self.get(doc['_id'])
            if old_doc['billing_contract_invoice'] and not self.context.has_roles(["finance"]):
                raise fields.FieldError("This item is already billed, you cannot change it anymore.")

            log_txt="Changed task note '{title}'".format(**doc)
        else:
            log_txt="Created new task note 'title'".format(**doc)

            if not 'thumbnail' in doc:
                #all ticketobjects always should have a thumbnail
                doc['thumbnail']=self.default_thumb_url.format(doc["type"])

        if not 'billing_contract_invoice' in doc:
            doc['billing_contract_invoice']=None

        ret=self._put(doc)


        #dont log simple simple updates (without type) and dont log ticket-changes 
        if 'type' in ret and ret['type']!='change':
            self.event("changed", ret)
            self.info(log_txt)
        else:
            #this results in only one event, even if many ticket objects will be changd, usefull for efficient autoinvoicing
            self.event("changed",{}) 

        if update_contract_invoice:
            #update old contract_invoice
            if '_id' in doc and old_doc["billing_contract_invoice"]!=doc["billing_contract_invoice"]:
                call_rpc(self.context, "ticket", "ContractInvoices", "recalc_minutes_used", _id=old_doc["billing_contract_invoice"])

            #update contract_invoice
            call_rpc(self.context, "ticket", "ContractInvoices", "recalc_minutes_used", _id=doc["billing_contract_invoice"])

        return(ret)



    @Acl(roles="user")
    def get(self, _id):

        #read the object unprotected
        ticket_object=super(models.core.Protected.Protected, self)._get(_id)

        #do we have access to at least one of the ticket the object belongs to?
        ret=None
        if len(ticket_object['tickets'])>0:
            ticket_model=models.ticket.Tickets.Tickets(self.context)
            tickets=ticket_model.get_all(match_in={
                    '_id': ticket_object['tickets']
                })

            if len(tickets)>0:
                ret=ticket_object

        #try a normal protected read. (object is only readable if use has explicit group or user permissions)
        if not ret:
            ret=self._get(_id)

        if "file" in ret:
            ret["file_url"]=self.get_file_url(ret)



        return(ret)

    @Acl(roles="user")
    def download(self, _id, *rest):
        """downloads the actual file. this should be called with GET"""
        doc=self.get(_id)
        return bottle.static_file(doc["file"], root=self.file_path, mimetype=doc["file_content_type"])

    @Acl(roles="user")
    def delete(self, _id):

        doc=self._get(_id)

        if doc["billing_contract_invoice"] and not self.context.has_roles(["finance"]):
            raise fields.FieldError("This item is already billed, you cannot delete it.")

        ret=self._delete(_id)

        self.event("deleted", ret)
        self.info("Deleted ticket item {title}".format(**doc))

        #update contract_invoices
        call_rpc(self.context, "ticket", "ContractInvoices", "recalc_minutes_used", _id=doc["billing_contract_invoice"])

        return(ret)


    def process_get_all(self, ticket_objects, **params):
        """add download urls and shorten/select text"""

        text_regex=None
        if "regex_or" in params:
            if "text" in params["regex_or"]:
                text_regex=re.compile(params["regex_or"]["text"], re.IGNORECASE)

        max_lines=20

        for ticket_object in ticket_objects:
            if "file" in ticket_object:
                ticket_object["file"]=self.get_file_url(ticket_object)

            if "text" in ticket_object:
                #make sure that text only contains lines that have the select_text in it
                #and is not longer than max_lines
                text_short=""
                lines=0
                for line in ticket_object["text"].split("\n"):
                    if not text_regex or re.search(text_regex, line):
                        text_short+=line+"\n"
                        lines=lines+1
                        if lines>=max_lines:
                            text_short+="..."
                            break

                ticket_object["text"]=text_short

    @Acl(roles="user")
    def get_all(self, **params):
        ticket_objects=self._get_all(**params)

        self.process_get_all(ticket_objects, **params)

        return(ticket_objects)

    @Acl(roles="user")
    def get_all_by_ticket(self, ticket_id, **params):
        '''get all ticket_objects for a certain ticket. this allows access to ticketobjects you normally dont have access to'''
        #make sure we have access to the ticket
        ticket_model=models.ticket.Tickets.Tickets(self.context)
        ticket_model.get(ticket_id)
        
        #call the 'unprotected' get_all but make sure it only returns objects that belong to this the ticket
        ticket_objects=super(models.core.Protected.Protected, self)._get_all(match_in={
             'tickets': [ ticket_id ]
            },
            **params)

        self.process_get_all(ticket_objects, **params)

        return(ticket_objects)


    @Acl(roles="user")
    def get_used_contracts(self, relation_id):
        '''get unique list of used contract_ids for specified relation'''

        return(
            self.db[self.default_collection].
                find({ "billing_relation" : bson.objectid.ObjectId(relation_id) }).
                distinct("billing_contract")
        )



