updateHourly2Monthly()
{
	send2log "=== updateHourly2Monthly === " 0
	local _pYear=$1
	local _pMonth=$2
	local _pDay=$3
	local rMonth=${_pMonth#0}
	local rYear=$_pYear

	if [ "$_pDay" -lt "$_ispBillingDay" ] ; then
		local rMonth=$(($rMonth-1))
		if [ "$rMonth" == "0" ] ; then
			rMonth=12
			local rYear=$(($rYear-1))
		fi
	fi
	_pMonth=$(printf %02d $_pMonth)
	rMonth=$(printf %02d $rMonth)
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

	local _prevhourlyUsageDB="$savePath$_pYear-$_pMonth-$_pDay-$_hourlyFileName"
	if [ ! -f "$_prevhourlyUsageDB" ]; then
		send2log "*** Hourly usage file not found ($_prevhourlyUsageDB)  (_organizeData:$_organizeData)" 2
		return
	fi
	local hsum=''
	local p_pnd_d=0
	local p_pnd_u=0
	local p_uptime=0
	local p_do_tot=0
	local p_up_tot=0
	local _maxInt="4294967295"
	local findstr=".*\"hour\":\"start\".*"
	local srch=$(cat "$_prevhourlyUsageDB")
	local cLine=$(echo "$srch" | grep -i "$findstr")
	local p_uptime=$(getCV "$cLine" "uptime")
	send2log "  >>> reading from $_prevhourlyUsageDB & writing to $_macUsageDB" 0
	local srb=0
	local reboots=''
	while read hline
	do
		local mac=$(echo "$hline" | grep -io '\"mac\":\"[a-z0-9\:\-]*\"' | cut -f4 -d"\"");
		local down=$(getCV "$hline" "down")
		local up=$(getCV "$hline" "up")
		local hr=$(getCV "$hline" "hour")
		if [ -z "$mac" ] && [ "$up" == "0" ] && [ "$down" == "0" ]; then
			send2log "  >>> skipping: $hline " 0
			continue
		elif [ -z "$mac" ] ; then
			fn="dtp"
			m_nm=''
			[ "$p_pnd_d" == "0" ] && p_pnd_d=$down
			[ "$p_pnd_u" == "0" ] && p_pnd_u=$up
		else
			fn="dt"
			m_nm="\"mac\":\"$mac\","
		fi
		local findstr="$fn({$m_nm\"day\":\"$_pDay\".*})"
		local cLine=$(echo "$hsum" | grep -i "$findstr")
		if [ "$fn" == "dt" ] && [ "$_unlimited_usage" -eq "1" ] ; then
			ul_do=$(getCV "$hline" "ul_do")
			ul_up=$(getCV "$hline" "ul_up")
		fi
		send2log "  >>> fn: $fn	mac: $mac   hline: $hline" 0
		if [ -z "$cLine" ] ; then		#Add a new line
			local newentry="$fn({$m_nm\"day\":\"$_pDay\",\"down\":$down,\"up\":$up})"
			[ "$fn" == "dt" ] && [ "$_unlimited_usage" -eq "1" ] && newentry="$fn({$m_nm\"day\":\"$_pDay\",\"down\":$down,\"up\":$up,\"ul_do\":$ul_do,\"ul_up\":$ul_up})"
			hsum="$hsum
$newentry"
			send2log "  >>> Add new line:	$newentry " 0
		elif [ "$fn" == "dt" ] ; then	#Update an existing hourly line
			local do_tot=$(getCV "$cLine" "down")
			local up_tot=$(getCV "$cLine" "up")

			do_tot=$(digitAdd "$do_tot" "$down")
			up_tot=$(digitAdd "$up_tot" "$up")
			[ "$do_tot" \< "0" ] && send2log "  >>> do_tot rolled over --> $do_tot" 0
			[ "$up_tot" \< "0" ] && send2log "  >>> up_tot rolled over --> $up_tot" 0
			[ "$do_tot" \< "0" ] && do_tot=$(digitSub "$_maxInt" "$do_tot")
			[ "$up_tot" \< "0" ] && up_tot=$(digitSub "$_maxInt" "$up_tot")
			if [ "$_unlimited_usage" -eq "1" ] ; then
				local ul_do_tot=$(getCV "$cLine" "ul_do")
				local ul_up_tot=$(getCV "$cLine" "ul_up")
				ul_do_tot=$(digitAdd "$ul_do_tot" "$ul_do")
				ul_up_tot=$(digitAdd "$ul_up_tot" "$ul_up")
				local newentry="$fn({$m_nm\"day\":\"$_pDay\",\"down\":$do_tot,\"up\":$up_tot,\"ul_do\":$ul_do_tot,\"ul_up\":$ul_up_tot})"
			else
				local newentry="$fn({$m_nm\"day\":\"$_pDay\",\"down\":$do_tot,\"up\":$up_tot})"
			fi
			hsum=$(echo "$hsum" | sed -e "s/$findstr/$newentry/g")
			send2log "  >>> update existing line:	$newentry " 0

		else	#Update an existing PND line
			local uptime=$(getCV "$hline" "uptime")
			send2log "  >>> hline: $hline" 0
			if [ "$uptime" -gt "$p_uptime" ] ; then
				svd=$(digitSub "$down" "$p_pnd_d")
				svu=$(digitSub "$up" "$p_pnd_u")
				[ "$svd" \< "0" ] && send2log "  >>> svd rolled over --> $svd" 0
				[ "$svu" \< "0" ] && send2log "  >>> svu rolled over --> $svu" 0
				[ "$svd" \< "0" ] && svd=$(digitSub "$_maxInt" "$svd")
				[ "$svu" \< "0" ] && svu=$(digitSub "$_maxInt" "$svu")
				p_do_tot=$(digitAdd "$p_do_tot" "$svd")
				p_up_tot=$(digitAdd "$p_up_tot" "$svu")
				send2log "  >>> update existing dtp line:	$newentry " 0
			else
				svd=$down
				svu=$up
				p_do_tot=$(digitAdd "$p_do_tot" "$svd")
				p_up_tot=$(digitAdd "$p_up_tot" "$svu")
				srb=$(($srb + 1))
				reboots=",\"reboots\":\"$srb\""
				send2log "  >>> Server rebooted... $hr - partial update /tuptime:$uptime	 p_uptime:$p_uptime$reboots" 2
			fi
			send2log "  >>> fn: $fn	hr: $hr	uptime: $uptime	 p_uptime: $p_uptime	svd: $svd	svu: $svu " 0
			local newentry="$fn({$m_nm\"day\":\"$_pDay\",\"down\":$p_do_tot,\"up\":$p_up_tot$reboots})"
			hsum=$(echo "$hsum" | sed -e "s/$findstr/$newentry/g")
			send2log "  >>> p_do_tot: $p_do_tot	p_up_tot: $p_up_tot " 0
			p_pnd_d=$down
			p_pnd_u=$up
			p_uptime=$uptime
		fi
	done < $_prevhourlyUsageDB

	hsum=$(echo "$hsum" | sed -e "s~var monthly_updated=.*~var monthly_updated=\"$ds\"~")

	echo "$hsum" >> $_macUsageDB
	send2log "hsum: $hsum" -1
	local ds=$(date +"%Y-%m-%d %H:%M:%S")
	[ "$_symlink2data" -eq "0" ] && copyfiles "$_macUsageDB" "$_macUsageWWW"

	send2log "=== done updateHourly2Monthly === " 0
}
digitAdd()
{
	local n1=$1
	local n2=$2
	local l1=${#n1}
	local l2=${#n2}
	if [ "$l1" -lt "10" ] && [ "$l2" -lt "10" ] ; then
		total=$(($n1+$n2))
		echo $total
		return
	fi
	local carry=0
	local total=''
	while [ "$l1" -gt "0" ] || [ "$l2" -gt "0" ]; do
		d1=0
		d2=0
		l1=$(($l1-1))
		l2=$(($l2-1))
		[ "$l1" -ge "0" ] && d1=${n1:$l1:1}
		[ "$l2" -ge "0" ] && d2=${n2:$l2:1}
		s=$(($d1+$d2+$carry))
		sum=$(($s%10))
		carry=$(($s/10))
		total="$sum$total"
	done
	[ "$carry" -eq "1" ] && total="$carry$total"
	echo $total
}
digitSub()
{
	local n1=$(echo "$1" | sed 's/-*//')
	local n2=$(echo "$2" | sed 's/-*//')
	local l1=${#n1}
	local l2=${#n2}
	if [ "$l1" -lt "10" ] && [ "$l2" -lt "10" ] ; then
		echo $(($n1-$n2))
		return
	fi
	local b=0
	local total=''
	local d1=0
	local d2=0
	local d=0
	while [ "$l1" -gt "0" ] || [ "$l2" -gt "0" ]; do
		d1=0
		d2=0
		l1=$(($l1-1))
		l2=$(($l2-1))
		[ "$l1" -ge "0" ] && d1=${n1:$l1:1}
		[ "$l2" -ge "0" ] && d2=${n2:$l2:1}
		[ "$d2" == "-" ] && d2=0
		d1=$(($d1-$b))
		b=0
		[ $d2 -gt $d1 ] && b="1"
		d=$(($d1+$b*10-$d2))
		total="$d$total"
	done
	[ "$b" -eq "1" ] && total="-$total"
	echo $(echo "$total" | sed 's/0*//')
}