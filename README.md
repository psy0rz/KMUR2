

Installing
==========

== Dependencies ==

- python wand
- tesseract
- pip3.4 install beaker
- pip3.4 install bottle
- pip3.4 install pymongo
- pip3.4 install reportlab
- pip3.4 install python3-memcached

== config ==

create a empty file: settings.py

on joyent/illumos you may have to add:

import os
os.environ["MAGICK_HOME"]="/opt/local"


== running ==

./run.py

..or deploy in a wsgi webserver 

= creating a new environment =


./newdomain mycompany.com

Now you can login with admin@mycompany.com and password "changeme".
