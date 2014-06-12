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

#

XUI=${DESTDIR}/usr/lib/xui

BUILT=built
IDL_GENSRC_DIR=${BUILT}/script/services

DOJO=dojo-1.7.2
RPCGEN=xc-rpcgen

IDLS=	xenmgr.xml \
	xenmgr_vm.xml \
	xenmgr_host.xml \
	vm_nic.xml \
	vm_disk.xml \
	input_daemon.xml \
	ctxusb_daemon.xml \
	xenvm.xml \
	surfman.xml \
	updatemgr.xml \
	network.xml \
	network_daemon.xml \
	network_domain.xml \
	org_freedesktop_upower.xml \
	org_freedesktop_upower_device.xml

JS_SRC=$(shell find widgets -type f -print )
DIST_SRC=$(shell find dist -type f -print )

IDL_GENSRC=${IDLS:%.xml=${IDL_GENSRC_DIR}/%_client.js}


all: built.stamp

# to maintain compatability with the existing relative paths we run two directories down,
# we don't need this as we can run our dojo binary from anywhere.

built.stamp: build/xenclient.profile.js ${JS_SRC}  ${IDL_GENSRC}  ${DIST_SRC}
	mkdir -p a/b/c
	mkdir -p ${BUILT}
	cp -dr dist/. ${BUILT}
	rm -rf dist/lib
	mkdir -p dist/lib
	(cd a/b/c && ${DOJO} profile="../../../build/xenclient.profile.js" --release --bin java )
	mkdir -p dist/lib
	cp -dr dist/lib/. ${BUILT}/lib
	rm -rf dist/lib
	find ${BUILT} -name '*.uncompressed.js' -exec rm '{}' ';'
	find ${BUILT} -name '*.commented.css' -exec rm '{}' ';'
	touch $@

install:
	install -m 0755 -d ${XUI}
	cp -dr ${BUILT}/. ${XUI}

	rm -rf ${XUI}/lib/citrix/common/templates
	rm -rf ${XUI}/lib/citrix/xenclient/templates

	# Remove unused themes
	rm -rf ${XUI}/lib/dijit/themes/claro
	rm -rf ${XUI}/lib/dijit/themes/nihilo
	rm -rf ${XUI}/lib/dijit/themes/soria

	rm -rf ${XUI}/lib/build-report.txt


clean:
	rm -f built.stamp 
	rm -rf dist/lib
	rm -rf ${BUILT}

${IDL_GENSRC_DIR}/%_client.js: ${IDL_DIR}/%.xml
	mkdir -p ${IDL_GENSRC_DIR}
	${RPCGEN} --javascript --client -o ${IDL_GENSRC_DIR} $< || rm -f $@





