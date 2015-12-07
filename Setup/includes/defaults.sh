##########################################################################
# Yet Another Monitor (YAMon)
# Copyright (c) 2013-2015 Al Caughey
# All rights reserved.
#
# default parameters - these values may be updated in readConfig()
#
##########################################################################

_version='2.3.0'
_file_version=2.3

_connectedUsers='/proc/net/arp'
[ -z "$d_baseDir" ] && d_baseDir=`dirname $0`
_lockDir="/tmp/YAMon-running"

YAMON_IP4='YAMON'
YAMON_IP6='YAMONv6'

#global defaults
d_firmware=0
d_updatefreq=30
d_publishInterval=4
_lang='en'
d_path2strings="$d_baseDir/strings/$_lang/"
d_setupWebDir="Setup/www/"
d_setupWebIndex="yamon2.html"
d_setupWebDev="yamon2.2.html"
d_dataDir="data/"
d_logDir="logs/"
d_wwwPath="/tmp/www/"
d_wwwJS="js/"
d_wwwCSS="css/"
d_wwwImages='images/'
d_wwwData="data/"
d_dowwwBU=0
d_wwwBU="wwwBU/"
d_usersFileName="users.js"
d_hourlyFileName="hourly_data.js"
d_usageFileName="mac_data.js"
d_configWWW="config.js"
d_symlink2data=1
d_enableLogging=1
d_log2file=1
d_loglevel=1
d_ispBillingDay=5
d_doDailyBU=1
d_tarBUs=0
d_doLiveUpdates=0
d_doCurrConnections=0
d_liveFileName="live_data.js"
d_dailyBUPath="daily-bu/"
d_unlimited_usage=0
d_unlimited_start="02:00"
d_unlimited_end="08:00"
d_lan_iface_only=0
d_settings_pswd=''
d_dnsmasq_conf="/tmp/dnsmasq.conf"
d_dnsmasq_leases="/tmp/dnsmasq.leases"
d_do_separator=""
d_includeBridge=0
d_bridgeMAC='XX:XX:XX:XX:XX:XX' #MUST be entered all upper case
d_bridgeIP='###.###.###.###'
d_defaultOwner='Unknown'
d_defaultDeviceName='New Device'
d_includeIPv6=0
d_doLocalFiles=0
d_dbkey=''
d_ignoreGateway=0
d_gatewayMAC=''
d_sendAlerts=0
d_organizeData=0
d_allowMultipleIPsperMAC=0

loadconfig(){
	local _configFile=$1
	while read row
	do
		eval $row
	done < $_configFile

	#if the parameters are missing then set them to the defaults
	[ -z "$_firmware" ] && _firmware=$d_firmware
	[ -z "$_updatefreq" ] && _updatefreq=$d_updatefreq
	[ -z "$_publishInterval" ] && _publishInterval=$d_publishInterval
	[ -z "$_enableLogging" ] && _enableLogging=$d_enableLogging
	[ -z "$_log2file" ] && _log2file=$d_log2file
	[ -z "$_loglevel" ] && _loglevel=$d_loglevel
	[ -z "$_ispBillingDay" ] && _ispBillingDay=$d_ispBillingDay
	[ -z "$_usersFileName" ] && _usersFileName=$d_usersFileName
	[ -z "$_usageFileName" ] && _usageFileName=$d_usageFileName
	[ -z "$_hourlyFileName" ] && _hourlyFileName=$d_hourlyFileName
	[ -z "$_doLiveUpdates" ] && _doLiveUpdates=$d_doLiveUpdates
	[ -z "$_doCurrConnections" ] && _doCurrConnections=$d_doCurrConnections
	[ -z "$_liveFileName" ] && _liveFileName=$d_liveFileName
	[ -z "$_doDailyBU" ] && _doDailyBU=$d_doDailyBU
	[ -z "$_dailyBUPath" ] && _dailyBUPath=$d_dailyBUPath
	[ -z "$_tarBUs" ] && _tarBUs=$d_tarBUs
	[ -z "$_baseDir" ] && _baseDir=$d_baseDir
	[ -z "$_setupWebDir" ] && _setupWebDir=$d_setupWebDir
	[ -z "$_setupWebIndex" ] && _setupWebIndex=$d_setupWebIndex
	[ -z "$_setupWebDev" ] && _setupWebDev=$d_setupWebDev
	[ -z "$_dataDir" ] && _dataDir=$d_dataDir
	[ -z "$_logDir" ] && _logDir=$d_logDir
	[ -z "$_wwwPath" ] && _wwwPath=$d_wwwPath
	[ -z "$_wwwJS" ] && _wwwJS=$d_wwwJS
	[ -z "$_wwwCSS" ] && _wwwCSS=$d_wwwCSS
	[ -z "$_wwwImages" ] && _wwwImages=$d_wwwImages
	[ -z "$_wwwData" ] && _wwwData=$d_wwwData
	[ -z "$_dowwwBU" ] && _dowwwBU=$d_dowwwBU
	[ -z "$_wwwBU" ] && _wwwBU=$d_wwwBU
	[ -z "$_configWWW" ] && _configWWW=$d_configWWW
	[ -z "$_unlimited_usage" ] && _unlimited_usage=$d_unlimited_usage
	[ -z "$_unlimited_start" ] && _unlimited_start=$d_unlimited_start
	[ -z "$_unlimited_end" ] && _unlimited_end=$d_unlimited_end
	[ -z "$_lan_iface_only" ] && _lan_iface_only=$d_lan_iface_only
	[ -z "$_settings_pswd" ] && _settings_pswd=$d_settings_pswd
	[ -z "$_dnsmasq_conf" ] && _dnsmasq_conf=$d_dnsmasq_conf
	[ -z "$_dnsmasq_leases" ] && _dnsmasq_leases=$d_dnsmasq_leases
	[ -z "$_do_separator" ] && _do_separator=$d_do_separator
	[ -z "$_includeBridge" ] && _includeBridge=$d_includeBridge
	[ -z "$_defaultOwner" ] && _defaultOwner=$d_defaultOwner
	[ -z "$_defaultDeviceName" ] && _defaultDeviceName=$d_defaultDeviceName
	[ -z "$_doLocalFiles" ] && _doLocalFiles=$d_doLocalFiles
	[ -z "$_dbkey" ] && _dbkey=$d_dbkey
	[ -z "$_sendAlerts" ] && _sendAlerts=$d_sendAlerts
	[ -z "$_ignoreGateway" ] && _ignoreGateway=$d_ignoreGateway
	[ -z "$_gatewayMAC" ] && _gatewayMAC=$d_gatewayMAC
	[ -z "$_organizeData" ] && _organizeData=$d_organizeData
	[ -z "$_allowMultipleIPsperMAC" ] && _allowMultipleIPsperMAC=$d_allowMultipleIPsperMAC
	[ -z "$_symlink2data" ] && _symlink2data=$d_symlink2data
	if [ "$_includeBridge" == "1" ] ; then
		[ -z "$_bridgeMAC" ] && _bridgeMAC=$d_bridgeMAC
		[ -z "$_bridgeIP" ] && _bridgeIP=$d_bridgeIP
		_bridgeMAC=$(echo "$_bridgeMAC" | tr '[a-z]' '[A-Z]')
	fi
	[ -z "$_includeIPv6" ] && _includeIPv6=$d_includeIPv6
    
    if [ "${_logDir:0:1}" == "/" ] ; then
		lfpath=$_logDir
	else
		lfpath=$_baseDir$_logDir
	fi
	logfilename="${lfpath}monitor-$_ds.log"
	ts=$(date +"%H:%M:%S")

	[ ! -d "$lfpath" ] && mkdir -p "$lfpath"
	[ ! -f "$logfilename" ] && echo "$_ds	$ts
---------------------------------------
YAMon :: version $_version
=======================================">>$logfilename
	[ -z "$started" ] || [ "$started" -eq "0" ] && send2log "
---------------------------------------
Starting the Yet Another Monitor script [ log ]
version $_version
=======================================
" 2
	send2log "Loaded config file: \`$_configFile\`
    "
}