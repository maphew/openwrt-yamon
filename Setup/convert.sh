#!/bin/sh

##########################################################################
# Yet Another Monitor (YAMon)                                            #
# Copyright (c) 2013-2015 Al Caughey                                     #
# All rights reserved.                                                   #
#                                                                        #
#  This program converts YAMon hourly & monthly usage files from the v1  #
#  format to the new v2 format.  The new files are created (with a .js   #
#  extension).  The original files are not altered in any way but you    #
#  back things up beforehand just in case!  Use at your own risk.        #
#                                                                        #
#  Updated: Apr 21, 2014 - removed quotes from numeric values            #
#                                                                        #
##########################################################################

_baseDir="/opt/YAMon2/"             # path to the installation folder (* default `/opt/YAMon/`)
_dataDir="data/"                   # path to the data directory (* default `data/`)

convert_hourly()
{
 	echo "$n. Converting old hourly usage:  $file
    m: $mo    d: $da    y: $yr"
    newfilename="$_baseDir$_dataDir$yr-$mo-$da-hourly_data.js"
    touch $newfilename
    newusage="var hourly_created=\"$ds\"
var hourly_updated=\"$ds\"
"
	while IFS=, read cMac cIP down up hour ul_do ul_up
	do
		[ -z "$down" ] && down=0
		[ -z "$up" ] && up=0
		[ -z "$ul_do" ] && ul_do=0
		[ -z "$ul_up" ] && ul_up=0
		newusage="$newusage
hu({\"mac\":\"$cMac\",\"hour\":\"$hour\",\"down\":$down,\"up\":$up,\"ul_do\":$ul_do,\"ul_up\":$ul_up})"
	done < "$file"
    echo "$newusage" > $newfilename
}
convert_monthly()
{
	echo "$n. Converting old monthly usage file:  $file
    m: $mo    d: $da    y: $yr"
    newfilename="$_baseDir$_dataDir$yr-$mo-$da-mac_data.js"
    touch $newfilename
    newusage="var usage_created=\"$ds\"
var usage_updated=\"$ds\"
"
	while IFS=, read cMac cIP down up day ul_do ul_up
	do
		[ -z "$down" ] && down=0
		[ -z "$up" ] && up=0
		[ -z "$ul_do" ] && ul_do=0
		[ -z "$ul_up" ] && ul_up=0
		newusage="$newusage
dt({\"mac\":\"$cMac\",\"day\":\"$day\",\"down\":$down,\"up\":$up,\"ul_do\":$ul_do,\"ul_up\":$ul_up})"
	done < "$file"
    echo "$newusage" > $newfilename
}

convert_ouf()
{
	echo "$n. Converting old devices file:  $file"
    
    newfilename="$_baseDir$_dataDir"users.js
    touch $newfilename
    newusage="var users_created=\"$ds\"
"
	while IFS=, read cMac cIP owner name colour
	do
        newusage="$newusage
ud_a({\"mac\":\"$cMac\",\"ip\":\"$cIP\",\"owner\":\"$owner\",\"name\":\"$name\",\"colour\":\"$colour\",\"added\":\"$ds\",\"updated\":\"$ds\"})"
	done < "$file"
    echo "$newusage" > $newfilename
}

n=1
ds=$(date +"%Y-%m-%d %H:%M:%S")
file="$_baseDir$_dataDir"users.file
if [ -f "$file" ] ; then
    convert_ouf
    n=$(($n+1))
fi
for file in $(find $_baseDir$_dataDir*.html)
do  
    #echo "file --> $file"
    ffn=$(echo "$file" | cut -d/ -f5)
    da=$(echo "$ffn" | cut -d- -f1)
    mo=$(echo "$ffn" | cut -d- -f2)
    yr=$(echo "$ffn" | cut -d- -f3)
    fn=$(echo "$ffn" | cut -d- -f4)
    if [ "$fn" == "mac_data.html" ] ; then
       convert_monthly
    elif [ "$fn" == "hourly_data.html" ] ; then
       convert_hourly
    elif [ "$fn" == "users.html" ] || [ "$fn" == "users.file" ] ; then
       convert_ouf
    else
        echo 'none of the above'
    fi
    n=$(($n+1))
done

