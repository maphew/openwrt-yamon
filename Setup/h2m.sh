#!/bin/sh

##########################################################################
# Yet Another Monitor (YAMon)
# Copyright (c) 2013-2015 Al Caughey
# All rights reserved.
#
#  This program recreates the monthly usage files from the hourlies.
#
#  The original files are not altered in any way but you should
#  back things up beforehand just in case!  Use at your own risk.
#
#  Updated:
#  - Apr 21, 2014 - added this header
#  - Oct 19, 2014 - now counts server reboots
#  - Mar 29, 2015 - now reads config.file and accounts for the value of _organizeData
#  - Aug 9, 2015 - fixed octal issues (leading zeroes on months)
#  - Aug 18, 2015 - replaced for...seq with while (for old firmware versions)
#  - Nov 1, 2015 - using source/includes
#
##########################################################################

d_baseDir=`dirname $0`
_configFile="$d_baseDir/config.file"

_cYear=$(date +%Y)
_cDay=$(date +%d)
_cMonth=$(date +%m)
_ds="$_cYear-$_cMonth-$_cDay"

source "$d_baseDir/includes/util.sh"
source "$d_baseDir/includes/defaults.sh"
loadconfig "$_configFile"
#_log2file=0
_usageFileName="mac_data2.js"

source "$d_baseDir/includes/hourly2monthly.sh"


send2log "=== updateHourly2Monthly === " 2
if [ ! -f "$_configFile" ] ; then
	echo "*** Cannot find  \`config.file\` in the following location:
>>>	$_configFile
If you are using a different default directory (other than the one specified above),
you must edit lines 19-20 in this file to point to your file location.
Otherwise, check spelling and permissions." 
	exit 0
fi

if [ -z $1 ] ; then
	echo "You must specify at least ONE parameters!
***************************
usage h2m.sh [month] [[year]] [[just]] --> process all days for the billing period start on
	 \`startday\` of \`month\` and going to \`startday -1\` of the next month
  if \`year\` is omitted, it is assumed to be the current year
  if \`just\` is included, then just that day in the specified interval will be updated
***************************"
	exit 0
fi


local mo=$1
mo=${mo#0}
rDay=$(printf %02d $_ispBillingDay)
rMonth=$(printf %02d $mo)

if [ -z $2 ] ;  then
	rYear=$(date +%Y)
else
	rYear=$2
fi
[ ! -z $3 ] && just=$3


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

local _prevhourlyUsageDB="$savePath$rYear-$rMonth-$rDay-$_hourlyFileName"

_macUsageDB="$savePath$rYear-$rMonth-$rDay-$_usageFileName"
ds=$(date +"%Y-%m-%d %H:%M:%S")
[ ! -f "$_macUsageDB" ] && touch $_macUsageDB

echo "var monthly_created=\"$ds\"
var monthly_updated=\"$ds\"" > $_macUsageDB

echo "Processing data files for billing interval: $rYear-$rMonth-$rDay"
echo ">>> saving to: $_macUsageDB"
echo ">>> just: $just"

local i=$_ispBillingDay
while [  "$i" -le "31" ]; do
	[ ! -z $just ] && [ "$just" -ne "$i" ] && i=$(($i+1)) && continue
	
	local d=$(printf %02d $i)
	updateHourly2Monthly "$rYear" "$rMonth" "$d" 
    i=$(($i+1))
done

send2log ">>> Finished to end of month" 2
if [ "$mo" -eq "12" ]; then
	rMonth='01'
	rYear=$(($rYear+1))
else
	local nm=$(($mo+1))
	rMonth=$(printf %02d $nm)
fi

i=1
while [  $i -lt "$_ispBillingDay" ]; do
	[ ! -z $just ] && [ "$just" -ne "$i" ] && i=$(($i+1)) && continue
	d=$(printf %02d $i)
	updateHourly2Monthly "$rYear" "$rMonth" "$d" 
    i=$(($i+1))
done
send2log ">>> Finished start to end of next interval" 2

ds=$(date +"%Y-%m-%d %H:%M:%S")
sed -i "s~var monthly_updated=.*~var monthly_updated=\"$ds\"~" $_macUsageDB
echo "=== done updateHourly2Monthly ===

Note: the new monthly usage file has been named *.$_usageFileName...
You may have to rename it before the data can be used by the reports or
copy and paste the data from this newly created file into your active
monthly usage file.
(By default a 2 is appended to the base name so that the original files
are not overwritten)."
