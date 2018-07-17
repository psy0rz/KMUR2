#!/usr/bin/env python3.4

import pymongo
import bson.objectid
import re
import argparse

parser = argparse.ArgumentParser()

parser.add_argument('--db', required=True, help='db to convert')

args = parser.parse_args()



mongodb_connection = pymongo.mongo_client.MongoClient(host='localhost')
db = mongodb_connection[args.db]




new_tickets={}

#create a copy with _id as key and clean old subtickets
tickets=db.models.ticket.Tickets.find()
for ticket in tickets:
    new_tickets[ticket['_id']]=dict(ticket) #copy
    new_tickets[ticket['_id']]['tickets']=set({})


# a ticket now should point to its parent task instead of a subtask (the other way around seemed like a good idea a long time ago when field-relations wherent fully completed)
tickets=db.models.ticket.Tickets.find()
for ticket in tickets:
    for sub_ticket_id in ticket['tickets']:
        #old situation "sub_ticket_id" is parent_ticket_id in new situation:
        if sub_ticket_id in new_tickets:
            new_tickets[sub_ticket_id]['tickets'].add(ticket['_id'])

#everything is swapped, now update db
for ticket in new_tickets.values():
    new_tickets[ticket['_id']]['tickets']=list( new_tickets[ticket['_id']]['tickets']) #convert set to list
    db.models.ticket.Tickets.update({'_id': ticket['_id'] }, new_tickets[ticket['_id']])
