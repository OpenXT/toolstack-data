#!/bin/sh
#
# Copyright (c) 2013 Citrix Systems, Inc.
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#

set -e

( cd "../dojo-sdk/util/buildscripts/" && rm "../../../dist/lib" -rf && ./build.sh profile="../../../build/xenclient.profile.js" --release --bin java )

if [ "${1}" ]; then
    #ssh -oCheckHostIP=no -oStrictHostKeyChecking=no root@"${1}" "newrole -r sysadm_r"
    #ssh -oCheckHostIP=no -oStrictHostKeyChecking=no root@"${1}" "setenforce 0"
    ssh -oCheckHostIP=no -oStrictHostKeyChecking=no root@"${1}" "mount -o remount,rw /"
	#ssh -oCheckHostIP=no -oStrictHostKeyChecking=no root@"${1}" "killall v4v-proxy" || true
    #ssh -oCheckHostIP=no -oStrictHostKeyChecking=no root@"${1}" "v4v-proxy -p 80 -p 8080 &"

    rsync -r ../dist/ root@"${1}":/usr/lib/xui/
    chromium-browser http://"${1}"
fi
