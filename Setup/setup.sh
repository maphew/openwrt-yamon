#!/bin/sh

##########################################################################
# Yet Another Monitor (YAMon)
# Copyright (c) 2013-2015 Al Caughey
# All rights reserved.
#
# Script to help set baseline values in config.file
#
##########################################################################

d_baseDir=`dirname $0`

if [ ! -d "$d_baseDir/includes" ] || [ ! -f "$d_baseDir/includes/defaults.sh" ] || [ ! -f "$d_baseDir/includes/util.sh" ]  ; then
    echo "
**************************** ERROR!!! ****************************
  You are missing the \`$d_baseDir/includes\` directory and/or 
  files contained within that directory. Please re-download the 
  latest version of YAMon and make sure that all of the necessary 
  files and folders are copied to \`$d_baseDir\`!
******************************************************************
"
    exit 0
fi 
source "$d_baseDir/includes/defaults.sh"
source "$d_baseDir/includes/util.sh"

clear

showmsg 'title.txt'
echo "
******************************************************************
This script will guide you through the process of setting up the 
basic parameters in your \`config.file\`. 

NB - a number of the advanced (aka less commonly used) settings 
	 are not currently addressed in this script.
     
If you want to use any of those features, you can edit your 
\`config.file\` directly (without actually having to stop the 
YAMon script).
******************************************************************
"
sleep 5

[ ! -f "$d_baseDir/config.file" ] && [ ! -f "$d_baseDir/default config.file" ] && echo '*** Cannot find either config.file or default config.file... 
	*** Please check your installation! ***
	*** Exiting the script. ***' && exit 0


echo "You are running this script from \`$d_baseDir\`."

_configFile="$d_baseDir/config.file"
[ -f "$d_baseDir/default config.file" ] && [ ! -f "$_configFile" ] && _configFile="$d_baseDir/default config.file"
loadconfig "$_configFile"
configStr=$(cat "$_configFile")

_baseDir=${d_baseDir/Setup/""}
logfilename="$_baseDir$_logDir"'setup.log'
[ ! -f "$logfilename" ] && touch "$logfilename"

echo "
In the prompts below, the recommended value is denoted with
an asterisk (*).  To accept this default, simply hit enter; 
otherwise type your preferred value (and then hit enter).
"
prompt '_baseDir' "Are all of the YAMon files in \`$_baseDir\`?" 'If no, enter the path to the installation directory.' "$_baseDir" ''

local yn_y="Options: 0->No -or- 1->Yes(*)"
local yn_n="Options: 0->No(*) -or- 1->Yes"
local zo_r=^[01]$
local zot_r=^[012]$

prompt '_firmware' 'What firmware is your router running?' 'Options: 0->DD-WRT(*) -or- 1->OpenWrt -or- 2->Asuswrt-Merlin' '0' ^[0-2]$
prompt '_ispBillingDay' 'What is your ISP bill roll-over date?' 'Enter the day number [1-31]' '' ^[1-9]$\|^[12][0-9]$\|^[3][01]$
prompt '_unlimited_usage' 'Does your ISP offer `Bonus Data`?\n(i.e., upcapped data usage during offpeak hours)' "$yn_n" '0' $zo_r
[ "$_unlimited_usage" -eq 1 ] && prompt '_unlimited_start' 'Start time for bonus data?' 'Enter the time in [hh:mm] format' '' ^[1-9]:[0-5][0-9]$\|^1[0-2]:[0-5][0-9]$
[ "$_unlimited_usage" -eq 1 ] && prompt '_unlimited_end' 'End time?' 'Enter the time in [hh:mm] format' '' ^[1-9]:[0-5][0-9]$\|^[1][0-2]:[0-5][0-9]$
prompt '_updatefreq' 'How frequently would you like to check the data?' 'Enter the interval in seconds [1-300 sec]' '30' ^[1-9]$\|^[1-9][0-9]$\|^[1-2][0-9][0-9]$\|^300$
prompt '_publishInterval' 'How many checks between updates in the reports?' 'Enter the number of checks [must be a positive integer]' '2' ^[1-9]$\|^[1-9][0-9]$\|^[1-9][0-9][0-9]$
prompt '_doLocalFiles' 'Do you want to use a local copy of the files hosted at usage-monitoring.com?' "Options: 0->No(*) -or- 1->copy using \`curl\` -or- 2->copy using \`wget\`" '0' $zot_r
prompt '_symlink2data' 'Create symbollic links to the web data directories?' "$yn_y" '1' $zo_r
prompt '_organizeData' 'Organize the data files (into directories by year or year-month)?' 'Options: 0->No(*) -or- 1->by year -or- 2->by year & month' '0' $zot_r
prompt '_enableLogging' 'Enable logging (for support & debugging purposes)?' "$yn_y" '1' $zo_r
[ "$_enableLogging" -eq 1 ] && prompt '_log2file' 'Where do you want to send the logging info?' 'Options: 0->screen -or- 1->file(*) -or- 2->both' '1' $zot_r
[ "$_enableLogging" -eq 1 ] && prompt '_loglevel' 'How much detail do you want in the logs?' 'Options: -1->really verbose -or- 0->all -or- 1->most(*) -or- 2->serious only' '1' ^[012]$\|^-1$
prompt '_doDailyBU' 'Enable daily backup of data files?' "$yn_y" '1' $zo_r
[ "$_doDailyBU" -eq 1 ] && prompt '_tarBUs' 'Compress the backups?' "$yn_y" '1' $zo_r

_configFile="$d_baseDir/config.file"
if [ ! -f "$_configFile" ] ; then
	touch "$_configFile"
	echo "
******************************************************************
Created and saved settings in new file: \`$_configFile\`
******************************************************************"
else
	copyfiles "$_configFile" "$d_baseDir/config.old"
	echo "
******************************************************************
Copied previous configuration settings to \`$d_baseDir/config.old\`
and saved new settings to \`$_configFile\`
******************************************************************"
fi
echo "$configStr" > "$_configFile"

su="${_baseDir}Setup/yamon.startup"

prompt 't_permissions' "Do you want to set directory permissions for \`${_baseDir}\` and \`${_wwwPath}\`?" "$yn_y" '1' $zo_r
if [ "$t_permissions" -eq "1" ] ; then
    prompt 't_perm' "What octal permission value do you want to use?" "e.g., 770(*)-> rwxrwx---" '770' ^[0-7][0-7][0-7]$
    chmod "$t_perm" -R "$_baseDir"
    chmod "$t_perm" -R "$_wwwPath"
else
    sd="${_baseDir}Setup/yamon.shutdown"
    ya="${_baseDir}Setup/yamon${_version}.sh"
    chmod 700 "$su"
    chmod 700 "$sd"
    chmod 700 "$ya"
fi

if [ "$_firmware" -ne "1" ] ; then
    prompt 't_startup' 'Do you want to create startup and shutdown scripts?' "$yn_y" '1' $zo_r
    if [ "$t_startup" -eq "1" ] ; then
        cnsu=$(nvram get rc_startup)
        if [ ! -z $(echo "$cnsu" | grep 'yamon') ] ; then
            echo -e "
    nvram-->rc_startup already contains the string \`yamon\`...\n    yamon.startup was not added"
        elif [ -z "$cnsu" ] ; then
            echo "
    nvram-->rc_startup was empty... yamon.startup was added"
            nvram set rc_startup="$su"
        else
            echo "
    nvram-->rc_startup was not empty... yamon.startup was appended"
            nvram set rc_startup="$cnsu
$su"
        fi
        cnsd=$(nvram get rc_shutdown)
        if [ ! -z $(echo "$cnsd" | grep 'yamon') ] ; then
            echo -e "
    nvram-->rc_shutdown already contains the string \`yamon\`...\n    yamon.shutdown was not added"
        elif [ -z "$cnsd" ] ; then
            echo "
    nvram-->rc_shutdown was empty... yamon.shutdown was added"
            nvram set rc_shutdown="$sd"
        else
            echo "
    nvram-->rc_shutdown was not empty... yamon.shutdown was appended"
            nvram set rc_shutdown="$shutdown
$sd"
        fi
        nvram commit
    fi
fi

prompt 't_launch' 'Do you want to launch YAMon now?' "$yn_y" '1' $zo_r
[ "$t_launch" -eq "1" ] && echo "Launching $su"  && "$su"