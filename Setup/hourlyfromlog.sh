#!/bin/sh

##########################################################################
# Yet Another Monitor (YAMon)
# Copyright (c) 2013-2015 Al Caughey
# All rights reserved.
#
#  This program recreates the hourly usage files from a log file.
#
#  The original files are not altered in any way but you should
#  back things up beforehand just in case!  Use at your own risk.
#
#  Updated:
#  - Dec 31, 2014 - created this script
#  - Mar 29, 2015 - now reads config.file and accounts for the value of _organizeData
#
##########################################################################



d_baseDir=`dirname $0`
_configFile="$d_baseDir"'/config.file'


d_usageFileName="mac_data2.js"
_loglevel=0
_logFileName="monitor-*.log"

send2log(){
	[ "$2" -ge "$_loglevel" ] && echo "$1"
}

hourlyusage(){
	send2log "========hourlyusage========" 2
	IFS=$'\n'

	local txt=""
	local phour=''
	while read row
	do
		local hu=$(echo "$row" | grep -o "hu.*")
		local mac=$(echo $hu | cut -f1 -d",")
		local hour=$(echo $hu | cut -f2 -d",")
		if [ "$hour" != "$phour" ] ; then
			echo "$hour"
			phour=$hour
		fi
		cLine=$(echo "$txt" | grep -i "$mac,$hour")
		if [ -z "$cLine" ] ; then
			#echo "add $hu"
			txt="$txt
$hu"
		else
			txt=$(echo "$txt" | sed -e "s/$mac,$hour.*/$hu/g")
			#echo "replace $hu"
		fi
	done < /tmp/hulines.txt
	echo "$txt" >> $_hourlyFileName
	echo "

	txt-->
$txt"
}
pndusage(){
	send2log "========pndusage========" 2
	IFS=$'\n'

	local txt=""
	local phour=''
	while read row
	do
		local pnd=$(echo "$row" | grep -o "pnd.*")
		local hour=$(echo $pnd | cut -f1 -d",")
		if [ "$hour" != "$phour" ] ; then
			echo "$hour"
			phour=$hour
		fi
		cLine=$(echo "$txt" | grep -i "$hour")
		if [ -z "$cLine" ] ; then
			#echo "add $pnd"
			txt="$txt
$pnd"
		else
			txt=$(echo "$txt" | sed -e "s/$hour.*/$pnd/g")
			#echo "replace $pnd"
		fi
	done < /tmp/pndlines.txt
	echo "$txt" >> $_hourlyFileName
	echo "

	txt-->
$txt"
}

send2log "=== hourlyfromlog === " 2
if [ ! -f "$_configFile" ] ; then
	send2log "*** Cannot find  \`config.file\` in the following location:
>>>	$_configFile
If you are using a different default directory (other than the one specified above),
you must edit lines 19-20 in this file to point to your file location.
Otherwise, check spelling and permissions." 0
	exit 0
fi

if [ -z $1 ] && [ -z $2 ] ; then
	send2log "You must specify at least two parameters!
***************************
usage:: hourlyfromlog.sh [day] [month] [[year]] --> regenerate hourly file
  from the logs.  NB logging must be turned on, and
  \`_loglevel\` in \`config.file\` has to be 1 or lower
  if \`year\` is omitted, it is assumed to be the current year

***************************" 2
	send2log "--> Exiting" 2
	exit 0
fi

send2log "  Reading config.file " 0
while read row
do
	eval $row
done < $_configFile

rday=$(printf %02d $1)
rMonth=$(printf %02d $2)
if [ -z $3 ] ;  then
	rYear=$(date +%Y)
else
	rYear=$3
fi






local savePath="$_baseDir$_dataDir"
case $_organizeData in
	(*"0"*)
		local savePath="$_baseDir$_dataDir"
	;;
	(*"1"*)
		local savePath="$_baseDir$_dataDir$rYear/"
	;;
	(*"2"*)
		local savePath="$_baseDir$_dataDir$rYear/$rMonth/"
	;;
esac



local _logFileName=$_baseDir$_logDir"monitor-$rYear-$rMonth-$rday.log"
local _hourlyFileName="$savePath$rYear-$rMonth-$rday-hourly_data2.js"

send2log "Processing log: $_logFileName" 2
if [ ! -f "$_logFileName" ] ; then
	send2log "Log file not found: $_logFileName" 2
	send2log "--> Exiting" 2
	exit 0
fi
send2log ">>> saving to: $_hourlyFileName

Be patient... as it will take several minutes for this process to complete!
" 2



if [ ! -f "$_hourlyFileName" ] ; then
	touch $_hourlyFileName
	ds=$(date +"%Y-%m-%d %H:%M:%S")
	echo "var hourly_created=\"$ds\"
var hourly_updated=\"$ds\"
var users_updated=\"$ds\"
var disk_utilization=\"00%\"
var serverUptime=\"00\"
var freeMem=\"00\",availMem=\"00\",totMem=\"00\"
serverloads(0.00,\"00:00:00\",0.00,\"00:00:00\")" > $_hourlyFileName
fi
send2log ">>> Reading: $_logFileName" 2
local srch=$(cat "$_logFileName")
send2log ">>> Extracting Hourly updates" 2
echo "$srch" | grep -i "newentry	hu"  > /tmp/hulines.txt
send2log ">>> Extracting PND updates" 2
echo "$srch" | grep -i "PND: [added|updated]"  > /tmp/pndlines.txt

hourlyusage
pndusage

send2log ">>> Removing temp files" 2
rm /tmp/hulines.txt
rm /tmp/pndlines.txt

send2log "--> Done" 2
