##########################################################################
# Yet Another Monitor (YAMon)
# Copyright (c) 2013-2015 Al Caughey
# All rights reserved.
#
# various utility functions (shared between one or more scripts)
#
##########################################################################

showmsg()
{
	local wm=$1
	msg="$(cat "$d_path2strings$wm" )"
	[ ! -z "$2" ] && msg=$(echo "$msg" | sed -e "s/15 seconds/$2 seconds/g" )
	echo -e "$msg"
}

prompt() {
	local resp
	local vn=$1
	eval nv=\$$vn
	local df="$4"
	local regex="$5"

	echo -e "
$2 
$3 
" >&2
    if [ -z $nv ] && [ -z $df ] ; then
        nv='n/a'
        df='n/a'
        readStr="  Type your preferred value --> "
    elif [ -z $df ] ; then
        readStr="  Hit <enter> to accept the current value: \`$nv\`
  or type your preferred value --> "
    elif [ -z $nv ] ; then
        nv='n/a'
        readStr="  Hit <enter> to accept the default: \`$df\` 
  or type your preferred value --> "
    elif [ "$df" == "$nv" ] ; then
        readStr="  Hit <enter> to accept the current/default value: \`$df\`
  or type your preferred value --> "
    else
        readStr="  Hit <enter> to accept the current value: \`$nv\` or \`d\` for the default: \`$df\`
  or type your preferred value --> "
    fi
	local tries=0
	while true; do
		read -p "$readStr" resp
		[ ! "$df" = 'n/a' ] && [ "$resp" == 'd' ] && resp="$df" && break
		[ ! "$nv" = 'n/a' ] && [ -z "$resp" ] && resp="$nv" && break
		[ "$nv" = 'n/a' ] && [ ! "$df" = 'n/a' ] && [ -z "$resp" ] && resp="$df" && break
		if [ ! -z "$regex" ] ;  then
            ig=$(echo "$resp" | egrep $regex)
			#echo "ig --> $ig ($regex)" >&2
			[ ! -z "$ig" ] && break
        fi
		tries=$(($tries + 1))
		if [ "$tries" -eq "3" ] ; then
			echo "*** Strike three... you're out!" >&2
			exit 0
		fi
		echo "   Please enter one of the specified values!" >&2
	done
	eval $vn=$resp
	updateConfig $vn $resp
}

updateConfig(){
	local vn=$1
	local nv=$2
	[ -z "$nv" ] && eval nv=\$$vn
	#echo "$vn--> $nv"
	local sv="$vn=.*#"
	local rv="$vn=\'$nv\'	 #"
	configStr=$(echo "$configStr" | sed -e "s~$sv~$rv~g")
}

copyfiles(){
	local src=$1
	local dst=$2
	$(cp -a $src $dst)
	local res=$?
	if [ "$res" -eq "1" ] ; then
		local pre='  !!!'
		local pos=' failed '
	else
		local pre='  >>>'
		local pos=' successful'
	fi
	local lvl=$(($res+1))
	send2log "$pre Copy from $src to $dst$pos ($res)" $lvl
}

send2log()
{
    local ll=$2
    [ -z "$ll" ] && ll=0
    #echo "send2log - $1 - $_enableLogging - $ll - $_loglevel - $logfilename"
	[ "$_enableLogging" -eq "0" ] && return
	[ "$ll" -lt "$_loglevel" ] && return
	local ts=$(date +"%H:%M:%S")
	if [ ! -f "$logfilename" ] ; then
		echo "$_ds $ts $ll $1
[ NB - this message is being shown on the screen because
  the path to the log file won't be known until
  the config file has been read. ]
"
		return
	fi
	[ "$_log2file" -gt "0" ] && _log_str="$_log_str
$_ds	$ts $ll	$1"
	[ "$_log2file" -ne "1" ] && echo -e "$_ds $ts $ll $1"
}

sendAlert()
{
	local subj="$1"
	local omsg="$2"

	[ -z "$ndAMS" ] && ndAMS=0
	local ds=$(date +"%Y-%m-%d %H:%M:%S")
	msg="$omsg \n\n Message sent: $ds"

	if [ -z "$_sendAlertTo" ] ; then
		send2log "sendAlert:: _sendAlertTo is null... cannot send message
    subj: $subj
    msg: $omsg" 2
		return
	elif [ "$ndAMS" -eq "$_ndAMS_dailymax" ] ; then
 		send2log "sendAlert:: exceeded daily alerts max... cannot send subj: $subj  msg: $omsg" 2
		subj="Please check your YAMon Settings!"
		msg="You have exceeded your alerts allocation (max $_ndAMS_dailymax messages per day).  This typically means that there is something wrong in your settings or configuration.  Please contact Al if you have any questions."
	elif [ "$ndAMS" -gt "$_ndAMS_dailymax" ] ; then
		send2log "sendAlert:: exceeded daily alerts max... cannot send subj: $subj  msg: $omsg" 0
		return
	fi

	if [ "$_sendAlerts" -eq "1" ] ; then
		subj=$(echo "$subj" | tr "'" '`')
		msg=$(echo "$msg" | tr "'" '`')
		local url="http://usage-monitoring.com/current/sendmail.php"
        curl -G -sS "$url" --data-urlencode "t=$_sendAlertTo" --data-urlencode "s=$subj" --data-urlencode "m=$msg"  > /tmp/sndm.txt

		local res=$(cat /tmp/sndm.txt)
		#echo "$res"
	elif [ "$_sendAlerts" -eq "2" ] ; then
		ECHO=/bin/echo
		$ECHO -e "Subject: $subj\n\n$msg\n\n" | $_path2MSMTP -C $_MSMTP_CONFIG -a gmail $_sendAlertTo
		send2log "calling sendAlert via msmtp - subj: $subj  msg: $msg" 2
	fi
	ndAMS=$(($ndAMS+1))
}

getCV()
{
	local result=$(echo "$1" | grep -io "\"$2\":[\"0-9]\{1,\}" | grep -o "[0-9]\{1,\}");
	[ -z $result ] && result=0
	echo "$result"
}