Build
=====

Development
-----------
build.bat - for building on Windows
build.sh - for building on Linux

Useful IDE External Tools
=========================

Execute
-------
Program: $FilePath$
Parameters: $Prompt$
Working Directory: $FileDir$

Deploy
------
Program: rsync
Parameters: -r $ProjectFileDir$/dist/ root@$Prompt$:/usr/lib/xui/
Working Directory:

Browse
------
Program: chromium-browser
Parameters: http://$Prompt$
Working Directory:

V4V
---
Program: ssh
Parameters: -oCheckHostIP=no -oStrictHostKeyChecking=no root@$Prompt$ v4v-proxy -p 80 -p 8080 &
Working Directory:

Read-Write
----------
Program: ssh
Parameters: -oCheckHostIP=no -oStrictHostKeyChecking=no root@$Prompt$ "mount -o remount,rw /"
Working Directory:

Notes
=====

-Read the readme.txt in the dojo-sdk folder
-All builds (windows, linux, development, staging and build server) use the same xenclient.profile.js file in this directory