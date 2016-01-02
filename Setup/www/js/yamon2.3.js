"use strict"
/*
##########################################################################
# Yet Another Monitor (YAMon)											 #
# Copyright (c) 2013-2014 Al Caughey									 #
# All rights reserved.													 #
#																		 #
#  This program is free software: you can redistribute it and/or modify  #
#  it under the terms of the GNU General Public License as published by  #
#  the Free Software Foundation, either version 3 of the License, or	 #
#  (at your option) any later version.									 #
#																		 #
#  This program is distributed in the hope that it will be useful,		 #
#  but WITHOUT ANY WARRANTY; without even the implied warranty of		 #
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the		 #
#  GNU General Public License for more details.							 #
#																		 #
#  See <http://www.usage-monitoring.com/license/> for a copy of the		 #
#  GNU General Public License or see <http://www.gnu.org/licenses/>.	 #
#																		 #
##########################################################################
HISTORY
2014-02-17 - Al C - version 2.0.0 - first iteration with the new features
2014-02-17 - Al C - version 2.0.1 - minor fixes (in util.js)
2014-03-31 - Al C - version 2.0.2 - fixed colours in users.js
2014-04-07 - Al C - version 2.0.3 - added days within the current reporting interval
2014-04-21 - Al C - version 2.0.5 - changed version # to be consistent with the script; added check for all new devices; better handling of changes to users.js
2014-04-27 - Al C - version 2.0.6 - breakdowns for devices
2014-05-03 - Al C - version 2.0.7 - server load range; monthly breakdown for groups and all devices (yeah!);B- added filtering and reverse IP lookup on the live usage tab;c - hide future dates in Monthly Breakdown table
2014-05-03 - Al C - version 2.0.8 - added available & free memory gauges 
2014-05-03 - Al C - version 2.0.9 - added ISP totals to Daily, Monthly & Monthly Breakdown tabs; ISP data in graphs; added optional password protection for the Setting tab; added router usage data (as obtained from /proc/net/dev rather than the traff daemon); B - added option to show/hide data at the router
2014-06-19 - Al C - version 2.0.10 - changes to timestamps; account for server uptime in usage at router 
2014-07-21 - Al C - version 2.0.11 - got router and ISP data working in monthly breakdown report; fix issue when router restarts after midnight 
2014-08-01 - Al C - version 2.0.12 - lost
2014-08-12 - Al C - version 2.0.13 - changed alert to an icon; added in-browser editing for users.js 
2014-09-16 - Al C - version 2.0.14 - date format options; 
2014-10-05 - Al C - version 2.0.15 - restructured internal data storage of monthly breakdown data (differences and percents); b - added monthly graph by user
2014-10-31 - Al C - version 2.0.16 - changed to be consistent with the server side files; b - added percents to monthly stacked, fixed totals row on monthly breakdown table
2014-11-05 - Al C - version 2.0.17 - added sync to database capability; b,c - numerous fixes to recover from clobbering 2.0.16; d - added useHTTPS, autoSave, fixed db loading issue
2015-01-01 - Al C - version 2.0.17 - e - fixed new year date issue and adding history
2015-06-09 - Al C - version 2.1.0 - version number update
2015-06-14 - Al C - version 2.1.0b - fixed prev/next interval buttons
2015-06-22 - Al C - version 2.1.0c - new flags and persisting IP info on Live Usage tab
2015-07-07 - Al C - version 2.1.0d - fixed .a-c click issues
*/
var js_version='2.1.0d',currentScript='2.1.0'
var g_debugLevel=-4,nDevicesReadFailures=0,nMonthlyReadFailures=0,nHourlyReadFailures=0,nLiveReadFailures=0
var _resetDay,_dec,_settings_pswd
var _rs_Date,_re_Date, _cr_Date
var refreshTimer,liveUpdatesTimer,old_last_update,loadingTimer
var g_toKB,g_toMB,g_toGB
var g_nobwCap
var g_Settings={}
var bDevicesChanged=true
var devices=[],names=[],monthly=[],monthly_totals=[],hourly=[],corrections=[],pnd_data=[],p_pnd_d=0,p_pnd_u=0,o_sut
var users_updated,p_users_updated,hourly_updated
var dispUnits=['b','Kb','MB','GB','TB','PB']
var livekbs_do=[],livekbs_up=[],s_usage=[],numLU=1
var gauges,livekbs_do_chart,livekbs_up_chart,sl_chart,gaugeOptions={animation:{duration:2000,easing:'inAndOut'},width:200,height:80,yellowFrom:75,yellowTo:90,redFrom:90,redTo:100,minorTicks:5};
var stillLoadingDevices=false
var g_base
var freeMem=0,totMem=0,availMem=null,disk_utilization="0%",serverUptime=null,_doCurrConnections=0
var colours_list=['DarkOliveGreen','Indigo','MediumPurple','Purple','MidnightBlue','DarkOrange','MediumSeaGreen','Red','Aqua','DarkOrchid','MediumSlateBlue','RosyBrown','AquaMarine','DarkRed','MediumSpringGreen','RoyalBlue','DarkSalmon','MediumTurquoise','SaddleBrown','DarkSeaGreen','LawnGreen','MediumVioletRed','Salmon','DarkSlateBlue','SandyBrown','DarkSlateGray','LightBlue','SeaGreen','DarkTurquoise','Blue','DarkViolet','Sienna','BlueViolet','DeepPink','Silver','Brown','DeepSkyBlue','Navy','SkyBlue','BurlyWood','DimGray','LightGreen','SlateBlue','CadetBlue','DodgerBlue','LightPink','Olive','SlateGray','Chartreuse','FireBrick','LightSalmon','OliveDrab','Chocolate','LightSeaGreen','Orange','SpringGreen','Coral','ForestGreen','LightSkyBlue','OrangeRed','SteelBlue','CornFlowerBlue','Fuchsia','LightSlateGray','Orchid','Tan','LightSteelBlue','PaleGoldenRod','Teal','Crimson','PaleGreen','Thistle','Cyan','Gold','Lime','PaleTurquoise','Tomato','DarkBlue','GoldenRod','LimeGreen','PaleVioletRed','Turquoise','DarkCyan','Gray','Violet','DarkGoldenRod','Green','Magenta','PeachPuff','Wheat','DarkGray','GreenYellow','Maroon','Peru','DarkGreen','MediumAquaMarine','Pink','DarkKhaki','HotPink','MediumBlue','Plum','Yellow','DarkMagenta','IndianRed','MediumOrchid','PowderBlue','YellowGreen','Ivory','Beige','WhiteSmoke','Bisque','Linen','OldLace','LightCoral','Lavender','Azure','Black','PapayaWhip','LightYellow','FloralWhite','LemonChiffon','AntiqueWhite','MintCream','SeaShell','LavenderBlush','LightCyan','LightGoldenrodYellow','BlanchedAlmond','MistyRose','NavajoWhite','Khaki', 'Moccasin','LightGray','Cornsilk','Gainsboro','HoneyDew','GhostWhite','White','AliceBlue','Snow']
$(document).ready(function (){
	$('#yamon_version').text(' Reports v'+js_version).after(' (<a id="script_version" target="_blank">'+(typeof(_scriptVersion)=='undefined'?'':'Script v'+_scriptVersion)+'</a>)')
	if(_scriptVersion=="2.0.14e"){
		alert("Sat Sept 13:  I've recently realized that there is a gross error in the logic of YAMon version 2.0.14e... Due to a (boneheaded) error in how the script remembered which devices were connected to your router, large portions of your traffic will not get included in your reports.\n\nYou should either revert to a previous version of the script or replace it with version 2.0.14g (which will be posted to the forum shortly).\n\nI'm terribly sorry for this error!\n\nAl")
	}
	if(typeof(_scriptVersion)=='undefined'){
		var msg='The variable `_scriptVersion` is not defined... this generally means that your `<a href="js/config.js" target="_blank">config.js</a>` is not properly defined.\n  I suggest that you restart yamon2.sh to recreate this file.'
		ShowAlert(msg,'sv-error')
	}
	else if(currentScript>_scriptVersion) $('#script_version').addClass('newScriptVersion').attr('title', 'Version '+currentScript+' is available for download!').attr('href', 'http://www.dd-wrt.com/phpBB2/viewtopic.php?t=259806')
    $('.settings-section').prepend("<p class='upgrade alert notices'>Please be advised that you are running a very old version of the YAMon script.  Please update to the current version which can be downloaded from <a href='http://www.dd-wrt.com/phpBB2/viewtopic.php?t=259806'> here</a></p>")
	resetdates()
	loadSettings()
	$('#error-notification').remove()
	$('#gauges').before("<span id='sp-uptime'><p>Server Uptime</p><p id='uptime'>n/a</p></span><span id='serverload'><p>Server Load Range</p><p id='sp_curSL'></p><p class='gradient'></p><p><span id='sp_minSL'></span><span id='sp_maxSL'></span></p></span>")
	$('#daily-isp-diff,#daily-isp-percent').addClass('is-isp') 
	$('#devicesHeader').after("<tr class='notices'><td colspan=7>You can now double-click a row in this table to revise the `owner`, `name` & `colour` fields.</td></tr>")
	$('.loading').draggable({ cursor: "move"})
	$('#DailyUsageHeader').after(" <tr class='notices'><td colspan='100%'>Double-click a row in this table to update the hourly usage chart below to show only results for<br/> that device/owner.</td></tr>")
	if(!$('#useHTTPS').length) $('#dbkey').after("<p id='p-useHTTPS'><input type='checkbox' id='useHTTPS'><label for='useHTTPS' checked> Use HTTPS</label></p>") 
	if(!$('#autoSave').length) $('#p-useHTTPS').after("<p id='p-autoSave'><input type='checkbox' id='autoSave'><label for='autoSave' checked> Auto save any changes</label></p>") 
	$('.loading').click(function(){
		$(this).fadeOut('slow')
	})
	
})
$(window).on('beforeunload', function(){
	if(typeof(_dbkey)=='undefined') return
	if(!$('#sv-btn').is(':visible')) return
	return 'You have unsaved changes on the Settings tab.  Leaving now will result in the loss of those changes!'
});
function setViews(){
	debugtrace("setViews",arguments,0)
	if(!g_Settings['complete']==1){
		$('#data-section,#summary-tab-section,.tabs,#p-timer').addClass('hidden')
		$('.intro,#settings-tab-section,#missing-txt').removeClass('hidden')
		clearLoading()
		return false
	}
	var init_tab='summary-tab-section'
	var init_view='daily-tab'
	$('#'.init_view).siblings('.settings-tab').addClass('not-selected')
	$('#summary-tab').removeClass('not-selected').siblings('.settings-tab').addClass('not-selected')
	$('#'+init_tab).removeClass('hidden').siblings('.settings-section').addClass('hidden')
	if(_unlimited_usage==1){
		$('.th-tot').addClass('click-td')
		$('#mb-router-th').attr('colspan',6)
		$('.ul-int').html('Unlimited Interval<br/>('+ _unlimited_start +' - '+ _unlimited_end +')')
		$('.isUL').removeClass('hidden')
		$('.th-tot').click(function(){
			$('#ul-redtot').click()
		})
	}
	load_devices()
	loadMonthly()
}
function setReportDates(ri){
	debugtrace("setReportDates",arguments,0)
	var da,mo,yr
	p_users_updated=''
	if(!ri){
		_cr_Date=new Date()
		da=_cr_Date.getDate()
		var da2=twod(da)
		mo=twod(_cr_Date.getMonth()-(-1))
		yr=_cr_Date.getFullYear()
		$('#p-timer').fadeIn('slow')
		_rs_Date=new Date(yr,mo-(da>=_resetDay?1:2),_resetDay)
		_re_Date=new Date(yr,mo-(da>=_resetDay?0:1),_resetDay-1, 23, 59, 59)
	}
	else{
		var de=ri.split('-')
		da=twod(de[2])
		mo=twod(de[1])
		yr=de[0]
		_rs_Date= new Date(yr,mo-1,da)
		_re_Date=new Date(yr,mo,da-1)
		_cr_Date=_rs_Date
	}
	$('.current-date').text(formattedDate(_cr_Date))
	$('.current-interval').text(formattedDate(_rs_Date)+' - '+formattedDate(_re_Date))
}
function loadMonthly(){
	
	var cm=$('#SystemTotalsTable .currentSummary').attr('id'), cleardata=true
	setReportDates(cm)

	debugtrace("loadMonthly",arguments,0)
	showLoading('Loading Monthly data file...')
	$('.loaded').removeClass('loaded')
	var yr=_rs_Date.getFullYear()
	var rm=twod(_rs_Date.getMonth()-(-1))
	var rd=twod(_resetDay)
	
	if(!g_Settings['corrections']||!g_Settings['corrections'][rm+'-'+yr]){
		var corrections={}
	}
	else{
		var corrections=JSON.parse(g_Settings['corrections'][rm+'-'+yr])
	}
	var od=typeof(_organizeData)=='undefined'?0:_organizeData
	var dp=$('#dataPath2').val()+(od==0?'':(od==1?yr+'/':yr+'/'+rm+'/'))
	var datafile=dp+yr+'-'+rm+'-'+rd+'-'+$('#usagefile2').val()
	
	monthly=[]
	zeroDevicesTotal()
	zeroMonthlyTotals()
	if(cleardata)$('#MonthlyBreakdown,#breakdownFooter').html('')
	$.getScript(datafile)
	.done(function(dlist,textStatus){
		flushChanges()
		var cdown=0,cup=0
		for(var d in corrections){
			if(corrections[d]){
				cdown=corrections[d].down*g_toMB
				cup=corrections[d].up*g_toMB
				monthly_totals.down+=cdown
				monthly_totals.up+=cup
				monthly_totals.usage[d].down+=cdown
				monthly_totals.usage[d].up+=cup
		   }
		}
		loadHourly(true)
		nMonthlyReadFailures=0
	})
	.fail(function(jqxhr,settings,exception){
		nMonthlyReadFailures++
		var msg='Error #'+nMonthlyReadFailures+' reading the monthly data file: `<a href="'+datafile+'" target="_blank">'+datafile+'</a>`\n'+exception
		if(nMonthlyReadFailures>3){
			ShowAlert(msg,'monthly-error')
			nMonthlyReadFailures=0
		}
		else{
			setTimeout(function(){loadMonthly()},1500)
		}
	})
	.always(function(dlist,textStatus){
	})
}
function dtp(arr){
	debugtrace("dtp",arguments,2)
	monthly_totals.pnd[arr.day*1]={down:arr.down,up:arr.up}
	monthly_totals.pnd[arr.day*1].reboots=arr.reboots||0
}
function check4Device(mac){
	if (!devices[mac]){
		debugtrace("check4Device",arguments,3)
		var uid=mac.replace(/:/g,"")
		var dt=new Date(), dts=dt.getFullYear()+'-'+twod(dt.getMonth()+1)+'-'+twod(dt.getDate())+' '+twod(dt.getHours())+'-'+twod(dt.getMinutes())+'-'+twod(dt.getSeconds())
		var n=Object.keys(devices).length
		devices[mac]={n:n,id:uid,group:'Unknown',colour:'',name:'new device - '+mac,added:dts,updated:dts}
		if(!names['unknown']){
			var n=Object.keys(names).length
			if(_unlimited_usage==0){
				names['unknown']={n:n, group:'Unknown',down:0,up:0,usage:[]}
			}
			else{
				names['unknown']={n:n, group:'Unknown',down:0,up:0,ul_down:0,ul_up:0,usage:[]}
			}
		}
	}
	if(!monthly[mac]){
		if(_unlimited_usage==0){
			monthly[mac]={down:0,up:0,usage:[]}
		}
		else{
			monthly[mac]={down:0,up:0,ul_down:0,ul_up:0,usage:[]}
		}
		cmu(mac)
	}

}
function dt(arr){
	debugtrace("dt",arguments,2)
	var mac=arr.mac.toUpperCase()
	if(mac=='FF:FF:FF:FF:FF:FF') return;
	check4Device(mac)
	//var group=devices[mac].group.toLowerCase(),dn=arr.day*1
	var group=clean(devices[mac].group).toLowerCase(),dn=arr.day*1

	if(!names[group]){
		var n=Object.keys(names).length
		if(_unlimited_usage==0){
			names[group]={n:n, group:arr.owner,down:0,up:0,usage:[]}
		}
		else{
			names[group]={n:n, group:arr.owner,down:0,up:0,ul_down:0,ul_up:0,usage:[]}
		}
	}
	if(!names[group].usage[dn]){
		if(_unlimited_usage==0){
			names[group].usage[dn]={down:0,up:0}
		}
		else{
			names[group].usage[dn]={down:0,up:0,ul_down:0,ul_up:0}
		}
	}
	if(!names[group].usage[dn]){
		if(_unlimited_usage==0){
			names[group].usage[dn]={down:0,up:0}
		}
		else{
			names[group].usage[dn]={down:0,up:0,ul_down:0,ul_up:0}
		}
	}
	var down=arr.down*1, up=arr.up*1
	monthly[mac].down+=down
	monthly[mac].up+=up
	names[group].down+=down
	names[group].up+=up
	monthly_totals.down+=down
	monthly_totals.up+=up
	monthly[mac].usage[dn]={down:down,up:up}
	names[group].usage[dn].down+=down
	names[group].usage[dn].up+=up
	monthly_totals.usage[dn].down+=down
	monthly_totals.usage[dn].up+=up
	if(_unlimited_usage==1){
		var ul_down=arr.ul_do*1, ul_up=arr.ul_up*1
		monthly[mac].ul_down+=ul_down
		monthly[mac].ul_up+=ul_up
		names[group].ul_down+=ul_down
		names[group].ul_up+=ul_up
		monthly_totals.ul_down+=ul_down
		monthly_totals.ul_up+=ul_up
		monthly[mac].usage[dn].ul_down=ul_down
		monthly[mac].usage[dn].ul_up=ul_up
		names[group].usage[dn].ul_down+=ul_down
		names[group].usage[dn].ul_up+=ul_up
		monthly_totals.usage[dn].ul_down+=ul_down
		monthly_totals.usage[dn].ul_up+=ul_up
   }
}
function zeroMonthlyTotals(){
	debugtrace("zeroMonthlyTotals",arguments,0)
	if(_unlimited_usage==0){
		monthly_totals={down:0,up:0,usage:[],pnd:[]}
		for(var x=1;x<32;x++){
			monthly_totals.usage[x]={down:0,up:0}
			monthly_totals.pnd[x]={down:0,up:0,reboots:0}
		}
	}
	else{
		monthly_totals={down:0,up:0,ul_down:0,ul_up:0,usage:[],pnd:[]}
		for(var x=1;x<32;x++){
			monthly_totals.usage[x]={down:0,up:0,ul_down:0,ul_up:0}
			monthly_totals.pnd[x]={down:0,up:0,ul_down:0,ul_up:0,reboots:0}
		}
	}
}
function loadView(cleardata){
	debugtrace("loadView",arguments,0)
	var cv=$('.data-view-name').not('.not-selected').attr('id')
	$('#'+cv+'-section').hasClass('hidden') && $('#'+cv+'-section').removeClass('hidden')
	switch(cv){
		case 'daily-tab':
			if(cleardata){
				$('#DailyData').html('')
			}
			setDailyTab()
			break;
		case 'live-tab':
			if(_doLiveUpdates==1&&$('#showLive').is(':checked')){
				liveUpdates()
				clearInterval(liveUpdatesTimer);
				liveUpdatesTimer=setInterval(liveUpdates,1000*_updatefreq)
			}
			break;
		case 'monthly-tab':
			if(cleardata){
				$('#MonthlyData').html('')
			}
			setMonthlyTab()
			break;
		case 'monthly-breakdown-tab':
			if(cleardata){
				$('#MonthlyBreakdown').html('')
			}
			if(!g_Settings['graphs']){
				set_bd_graphs()
			}
			var bd_graphs=g_Settings['graphs']
			Object.keys(bd_graphs).forEach(function(k){
				$('#'+k).prop('checked',bd_graphs[k])
			})			
			$('#no-graphs')[$('.gr-cb:checked').length==0?'addClass':'removeClass']('disabled-btn')
			$('#all-graphs')[$('.gr-cb').length==$('.gr-cb:checked').length?'addClass':'removeClass']('disabled-btn')
			monthlyBreakdown()
			break;
		case 'devices-tab':
			if(cleardata){
				$('#devicesData').html('')
			}
			refreshDevices()
			break;
	}
	$('#'+cv).addClass('loaded')
	showHideDevices()
	$('#'+cv+'-section .notices').fadeOut($('#fadeNotices').val()*1000)
}
function setDailyTab(){
	debugtrace("setDailyTab",arguments,0)
	var ul_redtot=$('#ul-redtot').is(':checked')?1:0
	var total=0,utot=0,dtot=0,ul_utot=0,ul_dtot=0
	var cd=_cr_Date.getDate()
	if(!corrections||!corrections[cd]){
		$('#correction-row,#remove-correction').hide()
		var cdu=0,cdd=0,cddesc=''
		var has_corr=0
		$('#add-correction').slideDown('slow')
	}
	else{
		$('#correction-row,#remove-correction').show()
		$('#add-correction').hide()
		var cddesc=corrections[cd].desc,cdu=corrections[cd].up,cdd=corrections[cd].down
		var has_corr=1
		utot=cdu*g_toMB
		dtot=cdd*g_toMB
		total=utot+dtot
	}
	$('.cf-desc').val(cddesc)
	$('.cf-u input').val(cdu)
	$('.cf-d input').val(cdd)
	$('#correction-row .TotalBytes').attr('value',total)
	$('#DailyData .is_z').removeClass('is_z')
	var inc_isp=$('#showISP').is(':checked'),inc_rd=$('#ShowRD').is(':checked')
	Object.keys(hourly).forEach(function(k){
		var did='dt-'+devices[k].id
		var gn=clean(devices[k].group),gid='gp-'+gn,ddn=clean(devices[k].name)
		var up=hourly[k].up*1,down=hourly[k].down*1,ul_up=0,ul_down=0,ut=up+down
		if(_unlimited_usage==1){
			var ul_up=hourly[k].ul_up*1,ul_down=hourly[k].ul_down*1,ut=up+down-(ul_up+ul_down)*ul_redtot
		}

		total+=ut
		utot+=up
		dtot+=down
		ul_utot+=ul_up
		ul_dtot+=ul_down
		if($("#"+gid).length==0){
			var nr=$('<tr/>').attr('id',gid).addClass('is_u').attr('g-n',gn)
			nr.append($('<td/>').addClass('br td-un').html("<span class='item-e'></span><span class='userName'>" +devices[k].group+"</span>"))
			nr.append($('<td/>').addClass('downloads num').attr('value',down))
			nr.append($('<td/>').addClass('uploads num br').attr('value',up))
			nr.append($('<td/>').addClass('isUL ul-down num').attr('value',ul_down))
			nr.append($('<td/>').addClass('isUL ul-up num br').attr('value',ul_up))
			nr.append($('<td/>').addClass('TotalBytes br2 num').attr('value',ut))
			nr.append($('<td/>').addClass('percent br'))
			$("#DailyData").append(nr)
		}
		else{
			var gdown=down+$("#"+gid).find('.downloads').attr('value')*1,
				gup=up+$("#"+gid).find('.uploads').attr('value')*1,
				gul_down=ul_down+$("#"+gid).find('.ul-down').attr('value')*1,
				gul_up=ul_up+$("#"+gid).find('.ul-up').attr('value')*1,
				gut=gup+gdown-(gul_up+gul_down)*ul_redtot
 			var arr=[[' .downloads',gdown],[' .uploads',gup],[' .ul-down',gul_down],[' .ul-up',gul_up],[' .TotalBytes',gut]]
			updateRow(gid,arr)	 
		}
		if($("#"+did).length==0){
			var nr=$('<tr/>').attr('id',did).attr('mac',k).attr('g-n',gn+'-'+ddn).addClass('is_d '+gid).attr('group',devices[k].group)
			var tcolour=devices[k].colour==''?colours_list[devices[k].n]:devices[k].colour
			nr.append($('<td/>').addClass('deviceName br').html("<span style='background-color:"+tcolour+"' class='legend-colour' title='Click to add/remove this device from the Hourly Graph below'></span><span class='thedevice'>"+devices[k].name+"</span>").attr('title', k+' | '+devices[k].ip))
			nr.append($('<td/>').addClass('downloads num').attr('value',down))
			nr.append($('<td/>').addClass('uploads num br').attr('value',up))
			nr.append($('<td/>').addClass('isUL ul-down num').attr('value',ul_down))
			nr.append($('<td/>').addClass('isUL ul-up num br').attr('value',ul_up))
			nr.append($('<td/>').addClass('TotalBytes br2 num').attr('value',ut))
			nr.append($('<td/>').addClass('percent br'))
			if($('.'+gid).length>0){
				 $('.'+gid).last().after(nr)
			}
			else {
				 $('#'+gid).after(nr)
			}
		}
		else{
			var arr=[[' .downloads',down],[' .uploads',up],[' .ul-down',ul_down],[' .ul-up',ul_up],[' .TotalBytes',ut]]
			updateRow(did,arr)
		}
	})
	$('#DailyData').html($('#DailyData tr').sort(byGN))
	$('#DailyData .legend-colour').unbind('click').click(function(e){
		if( $('#h_sd-ddl').is(':visible')){$('#h_sd-ddl').delay(250).slideUp('slow')}
		$('.fd-sel').removeClass('fd-sel')
		var ishidden=$(this).hasClass('op10')
		var mac=$(this).parent('tr').attr('mac')
		$(this)[ishidden?'removeClass':'addClass']('op10')
		$(this).next()[ishidden?'removeClass':'addClass']('so')
		DrawPie('Daily')
		DrawHourlyGraph()
		e.stopPropagation()
	})
	$('#DailyData .is_d').unbind('click').click(function(e){
		if( $('#h_sd-ddl').is(':visible')){$('#h_sd-ddl').delay(250).slideUp('slow')}
		$('.fd-sel').removeClass('fd-sel')
		$('#DailyData .legend-colour').addClass('op10')
		$('#DailyData .thedevice').addClass('so')
		$(this).find('.legend-colour').removeClass('op10')
		$(this).find('.thedevice').removeClass('so')
		DrawHourlyGraph()
	})
	$('#DailyData .is_u').unbind('click').click(function(e){
		if( $('#h_sd-ddl').is(':visible')){$('#h_sd-ddl').delay(250).slideUp('slow')}
		$('.fd-sel').removeClass('fd-sel')
		var wg='.'+$(this).attr('id')
		$('#DailyData .legend-colour').addClass('op10')
		$('#DailyData .thedevice').addClass('so')
		$(wg).find('.legend-colour').removeClass('op10')
		$(wg).find('.thedevice').removeClass('so')
		DrawHourlyGraph()
	})
	var arr=[[' .downloads',dtot],[' .uploads',utot],[' .ul-down',ul_dtot],[' .ul-up',ul_utot],[' .TotalBytes',total]]
	updateRow('DailyFooter',arr)
	if(!pnd_data||!pnd_data.total){
		$('#RouterFooter,#DiffFooter,#PercentFooter').hide()
	}
	else if(pnd_data.total.up==0&&pnd_data.total.down==0){
		$('#RouterFooter,#DiffFooter,#PercentFooter').hide()
	}
	else{
		$('#RouterFooter,#DiffFooter,#PercentFooter')[inc_rd?'show':'hide']()

		arr=[[' .downloads',pnd_data.total.down],[' .uploads',pnd_data.total.up],[' .TotalBytes',pnd_data.total.down+pnd_data.total.up]]
		updateRow('RouterFooter',arr)
		$('#RouterFooter .percent').text(((pnd_data.total.down+pnd_data.total.up)/total*100-100).toFixed(_dec))
		arr=[[' .downloads',pnd_data.total.down-dtot],[' .uploads',pnd_data.total.up-utot],[' .TotalBytes',pnd_data.total.down+pnd_data.total.up-total]]
		updateRow('DiffFooter',arr)

		$('#PercentFooter .downloads').text(((pnd_data.total.down-dtot)/dtot*100).toFixed(_dec))
		$('#PercentFooter .uploads').text(((pnd_data.total.up-utot)/utot*100).toFixed(_dec))
		$('#PercentFooter .TotalBytes').text(((pnd_data.total.down+pnd_data.total.up-total)/total*100).toFixed(_dec))
	}

	$('#h_sd-ddl').html("<span id='h_fd-all' class='h_fd'>All</span><span id='h_fd-none' class='h_fd'>None</span>")
	$('#Daily-usage-table .userName').each(function(){
		$('#h_sd-ddl').append("<span class='h_fd'>"+$(this).text()+"</span>")
	})
	$('.item-e')[$('#ShowDevices').is(':checked')?'removeClass':'addClass']('item-c')
	$('#Daily-usage-table .item-e').unbind('click').click(function(e){
		var is_e = $(this).hasClass('item-c')
		$(this)[is_e?'removeClass':'addClass']('item-c')
		var gn=$(this).parents('tr').attr('id')
		$('#Daily-usage-table .'+gn).not('.is_z')[is_e?'removeClass':'addClass']('hidden')
		DrawPie('Daily')
		DrawHourlyGraph()
		e.stopPropagation()
	})
	$('#DailyData .thedevice').unbind('click').click(function(e){
		var g_n=$(this).parents('tr').attr('g-n')
		$('#mb-filter').val('dd-'+g_n).change()
		e.stopPropagation() 
	})
	$('#DailyData .userName').unbind('click').click(function(e){
		var g_n=$(this).parents('tr').attr('g-n')
		$('#mb-filter').val('dd-'+g_n).change()
		e.stopPropagation() 
	})
	$('.h_fd').click(function(){
		var un=$(this).text()
		$('.fd-sel').removeClass('fd-sel')
		$(this).addClass('fd-sel')
		$('#h_sd-ddl').delay(250).slideUp('slow')
		$('#h_sd-dd').text(un)
		if(un=='All'){
			ShowDevices(1)
		}
		else if(un=='None'){
			 ShowDevices(0)
		}
		else{
			ShowUserDevices(un)
			$('#h_sd-dd').text(un)
		}
	})
	if($('#DailyData .is_d').length>0 && $('#DailyData .is_d').length-$('#DailyData .gp-unknown').length==0){
		ShowAlert("It appears that all of your devices have been added as `New/unknown` devices... If you've just started running YAMon, you can now go to the `Devices` tab and customize the owners & names for the devices on your network.",'devices-error')
	}
	$('#h_sd-ddl').mouseleave(function(){
		$(this).addClass('hidden')
	})
	if(inc_isp){
		var cd=_cr_Date.getDate(),mo=twod(_rs_Date.getMonth()+1),yr=_rs_Date.getFullYear()
		if(!g_Settings['isp'][mo+'-'+yr]){
			var isp_totals={}
		}
		else{
			var isp_totals=JSON.parse(g_Settings['isp'][mo+'-'+yr])
		}
		if(!isp_totals[cd]){
			$('#d-isp-d').val(0)
			$('#d-isp-u').val(0)
			$('#daily-isp-row .TotalBytes').attr('value',0)
			$('#daily-isp-row .percent').text('-')
			$('#daily-isp-diff,#daily-isp-percent').hide() 
		}
		else{
			var isp_d=isp_totals[cd].down*1,isp_u=isp_totals[cd].up*1
			$('#d-isp-d').val(isp_d/g_toMB)
			$('#d-isp-u').val(isp_u/g_toMB)
			$('#daily-isp-row .TotalBytes').attr('value',isp_d+isp_u)
			$('#daily-isp-row .percent').text(((isp_d+isp_u-total)/total*100).toFixed(_dec))
			$('#daily-isp-row,#daily-isp-diff,#daily-isp-percent').show() 
			arr=[[' .downloads',isp_d-dtot],[' .uploads',isp_u-utot],[' .TotalBytes',isp_d+isp_u-total]]
			updateRow('daily-isp-diff',arr)
			$('#daily-isp-percent .downloads').text(((isp_d-dtot)/dtot*100).toFixed(_dec))
			$('#daily-isp-percent .uploads').text(((isp_u-utot)/utot*100).toFixed(_dec))
			$('#daily-isp-percent .percent:last').text(((isp_d+isp_u-total)/total*100).toFixed(_dec))
		}	 
	}
	else{
		$('#Daily-usage-table .is-isp').hide()
	}

	$('.isUL')[_unlimited_usage==1?'removeClass':'addClass']('hidden')
	setPercents('#DailyData tr, #correction-row', total)
	displayBytes('#Daily-usage-table')
}
function setMonthlyTab(){
	debugtrace("setMonthlyTab",arguments,0)
	var ul_redtot=$('#ul-redtot').is(':checked')?1:0
	$('#MonthlyData .is_u').each(function(){
		var gid=$(this).attr('id'), arr=[[' .downloads',0],[' .uploads',0],[' .ul-down',0],[' .ul-up',0],[' .TotalBytes',0]]
		updateRow(gid,arr)		
	})
	var total=0,utot=0,dtot=0,ul_utot=0,ul_dtot=0
	var inc_isp=$('#showISP').is(':checked')
	Object.keys(monthly).forEach(function(k){
		var did='mt-'+devices[k].id
		var gn=clean(devices[k].group),gid='mgp-'+gn,ddn=clean(devices[k].name)
		var up=monthly[k].up*1,down=monthly[k].down*1,ul_up=0,ul_down=0,ut=up+down
		if(_unlimited_usage==1){
			var ul_up=monthly[k].ul_up*1,ul_down=monthly[k].ul_down*1,ut=up+down-(ul_up+ul_down)*ul_redtot
		}

		total+=ut
		utot+=up
		dtot+=down
		ul_utot+=ul_up
		ul_dtot+=ul_down
		if($("#"+gid).length==0){
			var nr=$('<tr/>').attr('id',gid).addClass('is_u').attr('g-n',gn)
			nr.append($('<td/>').addClass('br td-un').html("<span class='item-e'></span><span class='userName'>" +devices[k].group+"</span>"))
			nr.append($('<td/>').addClass('downloads num').attr('value',down))
			nr.append($('<td/>').addClass('uploads num br').attr('value',up))
			nr.append($('<td/>').addClass('isUL ul-down num').attr('value',ul_down))
			nr.append($('<td/>').addClass('isUL ul-up num br').attr('value',ul_up))
			nr.append($('<td/>').addClass('TotalBytes br2 num').attr('value',ut))
			nr.append($('<td/>').addClass('percent br'))
			$("#MonthlyData").append(nr)
		}
		else{
			var gdown=down+$("#"+gid).find('.downloads').attr('value')*1,
				gup=up+$("#"+gid).find('.uploads').attr('value')*1,
				gul_down=ul_down+$("#"+gid).find('.ul-down').attr('value')*1,
				gul_up=ul_up+$("#"+gid).find('.ul-up').attr('value')*1,
				gut=gup+gdown-(gul_up+gul_down)*ul_redtot
 			var arr=[[' .downloads',gdown],[' .uploads',gup],[' .ul-down',gul_down],[' .ul-up',gul_up],[' .TotalBytes',gut]]
			updateRow(gid,arr)	 
		}
		if($("#"+did).length==0){
			var nr=$('<tr/>').attr('id',did).attr('mac',k).attr('g-n',gn+'-'+ddn).addClass('is_d '+gid).attr('group',devices[k].group)
			var tcolour=devices[k].colour==''?colours_list[devices[k].n]:devices[k].colour
			nr.append($('<td/>').addClass('deviceName br').html("<span style='background-color:"+tcolour+"' class='legend-colour' title=''></span><span class='thedevice'>"+devices[k].name+"</span>").attr('title', k+' | '+devices[k].ip))
			nr.append($('<td/>').addClass('downloads num').attr('value',down))
			nr.append($('<td/>').addClass('uploads num br').attr('value',up))
			nr.append($('<td/>').addClass('isUL ul-down num').attr('value',ul_down))
			nr.append($('<td/>').addClass('isUL ul-up num br').attr('value',ul_up))
			nr.append($('<td/>').addClass('TotalBytes br2 num').attr('value',ut))
			nr.append($('<td/>').addClass('percent br'))
			if($('.'+gid).length>0){
				 $('.'+gid).last().after(nr)
			}
			else {
				 $('#'+gid).after(nr)
			}
		}
		else{
			var arr=[[' .downloads',down],[' .uploads',up],[' .ul-down',ul_down],[' .ul-up',ul_up],[' .TotalBytes',ut]]
			updateRow(did,arr)
		}
	})
	$('#MonthlyData').html($('#MonthlyData tr').sort(byGN))
	$('#MonthlyData .item-e')[$('#ShowDevices').is(':checked')?'removeClass':'addClass']('item-c')
	$('#MonthlyData .item-e').unbind('click').click(function(){
		var is_e = $(this).hasClass('item-c')
		$(this)[is_e?'removeClass':'addClass']('item-c')
		var gn=$(this).parents('tr').attr('id')
		$('#Monthly-usage-table .'+gn)[is_e?'removeClass':'addClass']('hidden')
		DrawPie('Monthly')
		_unlimited_usage=='1' && DrawPie('Unlimited')
	})
	$('#MonthlyData .thedevice').unbind('click').click(function(){
		var g_n=$(this).parents('tr').attr('g-n')
		$('#mb-filter').val('dd-'+g_n).change()
	})
	$('#MonthlyData .userName').unbind('click').click(function(){
		var g_n=$(this).parents('tr').attr('g-n')
		$('#mb-filter').val('dd-'+g_n).change()
	})

	var arr=[[' .downloads',dtot],[' .uploads',utot],[' .ul-down',ul_dtot],[' .ul-up',ul_utot],[' .TotalBytes',total]]
	updateRow('MonthlyFooter',arr)
	if(inc_isp){
		var cd=_cr_Date.getDate(),mo=twod(_rs_Date.getMonth()+1),yr=_rs_Date.getFullYear()
		if(!g_Settings['isp'][mo+'-'+yr]){
			$('#m-isp-d').attr('value',0)
			$('#m-isp-d').attr('value',0)
			$('#monthly-isp-row .TotalBytes').attr('value',0)
			$('#monthly-isp-row .percent ').text('-')
		}
		else{
			var isp_totals=JSON.parse(g_Settings['isp'][mo+'-'+yr]),isp_d=0,isp_u=0,mt=$('#MonthlyFooter .TotalBytes').attr('value')
			Object.keys(isp_totals).forEach(function(d){
				isp_d+=isp_totals[d].down*1
				isp_u+=isp_totals[d].up*1
			})
			$('#m-isp-d').attr('value',isp_d)
			$('#m-isp-u').attr('value',isp_u)
			$('#monthly-isp-row .TotalBytes').attr('value',isp_d+isp_u)
			$('#monthly-isp-row .percent ').text(((isp_d+isp_u-mt)/mt*100).toFixed(_dec))
		}
	}
	$('#Monthly-usage-table .isUL')[_unlimited_usage==1?'removeClass':'addClass']('hidden')
	setPercents('#MonthlyData tr, #Monthly-correction-row', total)
	displayBytes('#Monthly-usage-table')
	DrawMonthlybyDeviceGraph()
}
function ud_r(d){
	var id=d.replace(/:/g,""),nm=!monthly[d],dn=nm?0:monthly[d].down*1,up=nm?0:monthly[d].up*1,tot=dn+up
	debugtrace("ud_r",arguments,2)
	$('#dd-'+id).find('.group').text()!=devices[d].group && $('#dd-'+id).find('.group').addClass('achanged').text(devices[d].group)
	$('#dd-'+id).find('.deviceName').text()!=devices[d].name && $('#dd-'+id).find('.deviceName').addClass('achanged').text(devices[d].name)
	$('#dd-'+id).find('.deviceIP').text()!=devices[d].ip && $('#dd-'+id).find('.deviceIP').addClass('achanged').text(devices[d].ip)
	$('#dd-'+id).find('.TotalBytes').attr('value')!=tot && $('#dd-'+id).find('.TotalBytes').addClass('changed').attr('value',tot)
	$('#dd-'+id).find('.updated').text(lastmod(devices[d].updated,devices[d].added))
}
function ud_a(arr){
	debugtrace("ud_a",arguments,2)
	var mac=arr.mac.toUpperCase()+(!arr.key?'':('-'+arr.key))
	if(!g_Settings['devices']||!g_Settings['devices'][mac]){
		var group=arr.owner,name=arr.name,colour=arr.colour
	}
	else{
		var group=g_Settings['devices'][mac].group,name=g_Settings['devices'][mac].name,colour=g_Settings['devices'][mac].colour
	}
	var lgroup=group.toLowerCase()
	var uid=mac.replace(/:/g,"")
	if(devices[mac]===undefined){
		var n=Object.keys(devices).length
		devices[mac]={n:n,id:uid,ip:arr.ip,group:group,name:name,colour:colour,added:arr.added,updated:arr.updated}
	}
	else{
		devices[mac]={n:devices[mac].n,id:uid,ip:arr.ip,group:group,name:name,colour:colour,added:arr.added,updated:arr.updated}
	}
	if(!names[lgroup]){
		var n=Object.keys(names).length
		if(_unlimited_usage==0){
			names[lgroup]={n:n, group:group,down:0,up:0,usage:[]}
		}
		else{
			names[lgroup]={n:n, group:group,down:0,up:0,ul_down:0,ul_up:0,usage:[]}
		}
	}
}
function load_devices(){
	stillLoadingDevices=true
	debugtrace("load_devices",arguments,0)
	showLoading('Loading devices...')
	$('.loaded').removeClass('loaded')
	var device_file=$('#dataPath2').val()+$('#devicefile2').val()
	$("#devicesData .changed").removeClass('achanged')
	$.getScript(device_file)
	.done(function(list,textStatus){
        users_created=typeof(users_created)=='undefined'?null:users_created
        if (!users_created) alert("Your `users.js` file is missing the variable `users_created`... this is a bad thing.  Your `users.js` may be corrupted.")
		$('#sp_users_created').text(lastmod(users_created,'')).attr('title',users_created)
		nDevicesReadFailures=0
		stillLoadingDevices=false;
		var sel=$("#mb-filter").val()
		$("#mb-filter").html('<option value="ALL" selected>ALL Traffic By Day</option>')
		Object.keys(devices).sort(byName).forEach(function(d){
			var id=devices[d].id,u_n=clean(devices[d].group),ud=devices[d].name,u_d=clean(ud)
			$("#mb-filter").append($("<option/>").attr('id','mbd-'+d).attr('gp',devices[d].group).attr('value','dd-'+u_n+'-'+u_d).text(ud).addClass('ddl-d du-'+u_n))
		})
		Object.keys(names).forEach(function(n){
			var nn=clean(n)
			$(".du-"+nn).first().before($("<option/>").attr('id','mbd-'+nn).attr('value','dd-'+nn).text(names[n].group).addClass('ddl-u du-'+nn))
		})
		$("#mb-filter").val(sel)
		$(".mb-all").remove()
		$('#mb-filter').after("  <span class='mb-all hidden imp-text'>Show All</span>")
		$(".mb-all").click(function(){
			$('#monthly-breakdown-tab').removeClass('loaded')
			$('#mb-filter').val('ALL').change()
		})
	})
	.fail(function(jqxhr,settings,exception){
		nDevicesReadFailures++
		var msg='Error #'+nDevicesReadFailures+' reading the devices data file: `<a href="'+device_file+'" target="_blank">'+device_file+'</a>`\n'+exception
		if(nDevicesReadFailures>3){
			ShowAlert(msg,'devices-error')
			nDevicesReadFailures=0
		}
		else{
			setTimeout(function(){load_devices()},1500)
		}
		stillLoadingDevices=false;
	})
	.always(function(list,textStatus) {
	})
}

function curr_users(arr){
	debugtrace("curr_users",arguments,2)
	var speed=1000, easing='swing'
	var tt=last_update.split(' ')[1]
	if(old_last_update==last_update) return
	var mac=arr.mac.toUpperCase()
	var tt_id='cu-'+tt.replace(/:/gi,'-')
	var dt=old_last_update?(Date.parse(last_update)-Date.parse(old_last_update))/1000:_updatefreq
	var fltr=arr.ip==$('#filterIP').text()?' filter':''
	var pr=$('<p/>').addClass('p-cu hidden '+tt_id+fltr).attr('ip',arr.ip).click(function(){
		if(_doCurrConnections==0) return
		$('#filterIP').text($(this).attr('ip'))
		$('.filter').removeClass('filter')
		$(this).addClass('filter')
		activeConnections()
	})
	pr.append($('<span/>').addClass('td-time br a-r').text(tt))
	pr.append($('<span/>').addClass('cu-o').text(devices[mac].group))
	pr.append($('<span/>').addClass('cu-d br').text(devices[mac].name))
	pr.append($('<span/>').addClass('td-num num cu_do').attr('value',arr.down))
	pr.append($('<span/>').addClass('td-num br').text((arr.down/dt/g_toKB).toFixed(_dec)))
	pr.append($('<span/>').addClass('td-num num cu_up').attr('value',arr.up))
	pr.append($('<span/>').addClass('td-num br').text((arr.up/dt/g_toKB).toFixed(_dec)))
	$('#curr-users').prepend(pr)
	$('.p-cu:first').animate({opacity: 'toggle', height: 'toggle'}, speed, easing)
}
function curr_users_totals(tt){
	debugtrace("curr_users_totals",arguments,2)
	var dt=old_last_update?(Date.parse(last_update)-Date.parse(old_last_update))/1000:_updatefreq
	var speed=1000, easing='swing'
	var tt_id='cu-'+tt.replace(/:/gi,'-')
	if($('#'+tt_id).length>0) return
	var ncu=$('.'+tt_id).length
	if(ncu==0) return
	$('#curc').text(ncu + " Current Device" + (ncu==1?"":'s'))
	var t_do=0,t_up=0
	$('.'+tt_id).each(function(){
		t_do+=$(this).find('.cu_do').attr('value')*1
		t_up+=$(this).find('.cu_up').attr('value')*1
	})
	var c_conns=(_doCurrConnections==1)?curr_connections.length:'n/a'
	$('#curr-users-gt').attr('value', $('#curr-users-gt').attr('value')*1+dt)
	$('#cu-gt-do').attr('value', $('#cu-gt-do').attr('value')*1+t_do)
	$('#cu-gt-up').attr('value', $('#cu-gt-up').attr('value')*1+t_up)
	$('#cu-kbs-do').text(($('#cu-gt-do').attr('value')/$('#curr-users-gt').attr('value')/g_toKB).toFixed(_dec))
	$('#cu-kbs-up').text(($('#cu-gt-up').attr('value')/$('#curr-users-gt').attr('value')/g_toKB).toFixed(_dec))
	var pr=$('<p/>').addClass('p-cu-tot hidden').attr('id',tt_id)
	pr.append($('<span/>').addClass('td-time br a-r').text(numLU + '. Totals'))
	pr.append($('<span/>').addClass('cu-o').text('devices: '+ncu))
	pr.append($('<span/>').addClass('cu-d br').text('connections: '+c_conns))
	pr.append($('<span/>').addClass('td-num num').attr('value',t_do))
	pr.append($('<span/>').addClass('td-num br kbs-do').text((t_do/dt/g_toKB).toFixed(_dec)))
	pr.append($('<span/>').addClass('td-num num').attr('value',t_up))
	pr.append($('<span/>').addClass('td-num kbs-up br').text((t_up/dt/g_toKB).toFixed(_dec)))
	$('.'+tt_id).last().after(pr)
	$('.p-cu-tot:first').animate({opacity: 'toggle', height: 'toggle'}, speed, easing)
	numLU++
	displayBytes('.'+tt_id+',#curr-users-gt,.p-cu-tot:first')
	$('#curr-users .div-cu:first-child').animate({opacity: 'toggle', height: 'toggle'}, speed, easing)
	while($('.p-cu-tot:visible').length>($('#hmUpdateRows').val()*1+1)){
		var l_id=$('.p-cu-tot:last').attr('id')
		$('#'+l_id+',.'+l_id).remove()
	}
	if($('.p-cu-tot:visible').length>$('#hmUpdateRows').val()*1){
		var l_id=$('.p-cu-tot:last').attr('id')
		$('.'+l_id).animate({opacity: 'toggle', height: 'toggle'}, speed, easing, function(){
			$('#'+l_id).animate({opacity: 'toggle', height: 'toggle'}, speed, easing)
		})
	}
	livekbs_do.addRow([tt,$('.kbs-do:first').text()*1,$('#cu-kbs-do').text()*1])
	livekbs_up.addRow([tt,$('.kbs-up:first').text()*1,$('#cu-kbs-up').text()*1])
	var do_options={width:500,height:300,chartArea: {width: '85%', height: '70%'},title:'Live Downloads (in KB/s)',curveType:'function',fontSize:9,legend:{position:'top',fontSize:14},isStacked:true,hAxis:{title:'Time',fontSize:14,slantedText:true,titleTextStyle:{color:'green'}},vAxis:{title:'Usage in KB/s',fontSize:14,titleTextStyle:{color:'green'},viewWindow:{min:0}},series:{0:{lineWidth:1,color:'red',visibleInLegend:true},1:{lineWidth:1,color:'green',visibleInLegend:true}}}
	var up_options={width:500,height:300,chartArea: {width: '85%', height: '70%'},title:'Live Uploads (in KB/s)',curveType:'function',fontSize:9,legend:{position:'top',fontSize:14},isStacked:true,hAxis:{title:'Time',fontSize:14,slantedText:true,titleTextStyle:{color:'green'}},vAxis:{title:'Usage in KB/s',fontSize:14,titleTextStyle:{color:'green'},viewWindow:{min:0}},series:{0:{lineWidth:1,color:'blue',visibleInLegend:true},1:{lineWidth:1,color:'purple',visibleInLegend:true}}}
	livekbs_do_chart.draw(livekbs_do,do_options)
	livekbs_up_chart.draw(livekbs_up,up_options)
}
function serverload(l1,l5,l15){
	debugtrace("serverload",arguments,2)
	var speed=1000, easing='swing'
	var tt=last_update.split(' ')[1]
	var tt_id=tt.replace(/:/gi,'-')
	if(old_last_update==last_update) return
	if($('#'+tt_id).length==0){
		var tr=$('<p/>').attr('id',tt_id).addClass('p-tr hidden')
		tr.append($('<span/>').addClass('td-time br a-r').text(tt))
		tr.append($('<span/>').addClass('td-num ls-m1').text(l1.toFixed(2)))
		tr.append($('<span/>').addClass('td-num ls-m5').text(l5.toFixed(2)))
		tr.append($('<span/>').addClass('td-num ls-m15').text(l15.toFixed(2)))
		$('#liveServer').prepend(tr)
		$('#luReset').fadeIn('slow')
		$('#liveServer p').first().animate({opacity: 'toggle', height: 'toggle'}, speed, easing)
		while($('#liveServer p:visible').length>$('#hmUpdateRows').val()*1+1){
			$('#liveServer p:visible').last().addClass('hidden')
		}
		if($('#liveServer p:visible').length>$('#hmUpdateRows').val()*1){
			$('#liveServer p:visible').last().animate({opacity: 'toggle', height: 'toggle'}, speed, easing)
		}
	}
	s_usage.addRow([tt,l1,l5,l15])
	var baroptions={
		width:700,height:300,title:'Average Server Load',curveType:'function',fontSize:9,legend:{position:'top',fontSize:14},isStacked:true,hAxis:{title:'Time',fontSize:14,slantedText:true,titleTextStyle:{color:'green'}},vAxis:{title:'Load',fontSize:14,titleTextStyle:{color:'green'},viewWindow:{min:0}},series:{0:{lineWidth:1,color:'blue',visibleInLegend:true},1:{lineWidth:1,color:'green',visibleInLegend:true},2:{lineWidth:1,color:'red',visibleInLegend:true}}
	};
	sl_chart.draw(s_usage,baroptions)
	var wm=200/Math.max(_processors*2,$('#sp_maxSL').text()*1)
	$('#sp_curSL').text(l1.toFixed(2)).attr('title','Current load')
	var l3=l1*wm-Math.max(20,$('#sp_curSL').width())/2
	$('#sp_curSL').css('left',l3)

}
function activeConnections(){
	debugtrace("activeConnections",arguments,1)
	if(_doCurrConnections==0) return
	if($('#filterIP').length==0){
		$('#current-devices h2:first').append("<br/>Filter: <span id='filterIP'/><img src='http://usage-monitoring.com/current/images/close.png' class='img-12' onClick='clearFilter()'></span><span class='normal'>(Click an entry in the table below to filter the table on the right)</span>")
	}
	var filterIP=$('#filterIP').text()
	$('#filterIP').next('img')[filterIP==''?'fadeOut':'fadeIn']('slow')
	$('#act-cons-body').html('')
	$('#acrc').text(curr_connections.length + " Active Connection" + (curr_connections.length==1?"":'s') )
	$("#act-cons th:contains('Destination')").attr('colspan',2)
	if(!g_Settings['IPs']) g_Settings['IPs']={}
	var	g_IPs=g_Settings['IPs']||{}
	for(var i in curr_connections){
		if(filterIP==''||filterIP==curr_connections[i][1]||filterIP==curr_connections[i][3]){
			var iptxt,cs='',cn='',ipfnd=g_IPs[curr_connections[i][3]]?' ipfnd':''
			if(!g_IPs[curr_connections[i][3]]){
				iptxt=curr_connections[i][3]
			}
			else{
				var ipv=g_IPs[curr_connections[i][3]].split('|')
				iptxt=ipv[0]+(ipv[2]==''?'':'<br/>'+ipv[2])
				cs=ipv[1].replace(' ', '-')||'f-unk'
				cn=ipv[1]
			}
			var nr=$('<tr/>').addClass('acon-row')
			nr.append($('<td/>').html(curr_connections[i][0]).addClass('br'))
			nr.append($('<td/>').html(curr_connections[i][1]).addClass('a-c'))
			nr.append($('<td/>').html(curr_connections[i][2]).addClass('a-c br'))
			nr.append($('<td/>').attr('title',curr_connections[i][3]).html(iptxt).addClass('a-c dest-ip'+ipfnd).click(function(){
				var ctd=$(this), href='http://ip-api.com/json/'+ctd.text()
				$.get(href)
				.done(function(list,textStatus){
						var	ip=ctd.attr('title')
						if(!list['org']) return
						var nt=list['org']+"|"+list['country']+"|"+list['city']
						iptxt=list['org']+(list['city']==''?'':'<br/>'+list['city'])
						$(".dest-ip[title='"+ip+"']").each(function(){
							$(this).unbind('click').html(iptxt).addClass('ipfnd')
							$(this).next().addClass(list['country'].replace(' ','-')).attr('title',list['country'])
						})
						g_Settings['IPs'][ip]=nt 
						saveSettings(false)
					})   
				})
			)
			nr.append($('<td/>').addClass('flag '+cs).attr('title', cs))
			nr.append($('<td/>').html(curr_connections[i][4]).addClass('a-c br').attr('title', cn))
			$('#act-cons-body').append(nr)
		}
	}
	if($('.acon-row').length!=curr_connections.length) $('#acrc').append('<br/>('+$('.acon-row').length+ ' filtered for '+ $('.filter:first .cu-o').text()+'-'+$('.filter:first .cu-d').text()+'<img src="http://usage-monitoring.com/current/images/close.png" class="img-12" onClick="clearFilter()">)')
}
function liveUpdates(){
	debugtrace("liveUpdates",arguments,0)
	function countTo(t,d){
		debugtrace("countTo",arguments,2)
		var nv=$("#freeMem").html()*1+d
		$("#freeMem").text(nv)
		if(nv>=t){
			clearInterval(c2timer)
		}
	}
	var c2timer
	if(Object.keys(devices).length==0)return
	$.getScript(_liveFileName)
	.done(function( script, textStatus ) {
		var tt=last_update.split(' ')[1]
		if($("#freeMem").text()==''){$("#freeMem").text(freeMem)}
		var dfm=freeMem-$("#freeMem").text()*1
		if(dfm!=0){
			c2timer=setInterval(function() { countTo(freeMem, dfm>0?1:-1)},1000*_updatefreq/Math.abs(dfm*1.333))
		}
		curr_users_totals(tt)
		if(_doCurrConnections==1) activeConnections()
		old_last_update=last_update
		nLiveReadFailures=0
	})
	.fail(function( jqxhr, settings, exception ) {
		nLiveReadFailures++
		var msg='Error #'+nLiveReadFailures+' reading the LiveUsage data file: `<a href="'+_liveFileName+'" target="_blank">'+_liveFileName+'</a>`\n'+exception
		if(nLiveReadFailures>3){
			ShowAlert(msg,'live-error')
			nLiveReadFailures=0
		}
		else{
			setTimeout(function(){liveUpdates()},1500)
		}
	})
}
function setSummaryTotals(){
	debugtrace("setSummaryTotals",arguments,0)
	flushChanges()
	var report=g_Settings['summaries'],bw_cap=$('#bw_cap').val()*g_toGB,dlo=$('#bandwidth-l').is(':checked')&&$('#cb-dl-o').is(':checked')
	$('.tot-dlo').html(dlo?'Downloads<br/>Only':'Total<br/>Usage')
	var ul_redtot=$('#ul-redtot').is(':checked')?1:0
	var cTB=$('.currentSummary .TotalBytes ').attr('value')	

	Object.keys(report).sort(byDate).forEach(function(bill){
		if (!report[bill])return
		var de=bill.split('-'),yr=de[0],mo=de[1],da=de[2]
		var values = report[bill].split(';')
		var up=values[0]*1,down=values[1]*1
		if(_unlimited_usage==1){
			var ul_up=values[2]==''?0:values[2]*1,ul_dn=values[3]==''?0:values[3]*1
			up-=(ul_up)*ul_redtot
			down-=(ul_dn)*ul_redtot
		}
		if($("#"+bill).length==0){
			var nr=$('<tr/>').attr('id',bill).addClass('summary-row')
			nr.append($('<td/>').html("<span class='interval'>"+yr+'-'+mo+'-'+da+"</span>").addClass('br'))
			nr.append($('<td/>').addClass('downloads num').attr('value',down))
			nr.append($('<td/>').addClass('uploads num  br').attr('value',up))
			nr.append($('<td/>').addClass('TotalBytes str num br2').attr('value',dlo?down:(up+down)))
			nr.append($('<td/>').addClass('percent is-cap br2'))
			nr.append($('<td/>').addClass('a-c del-row'))
			$('#SystemTotalsTable').append(nr)
		}
		else{
  			var arr=[[' .downloads',down],[' .uploads',up],[' .TotalBytes',dlo?down:(up+down)]]
			updateRow(bill,arr)	 
		}
	})
	$('.del-row').unbind('mouseenter').mouseenter(function(){
		if($(this).parents('.summary-row').is(':first-child'))return
		$(this).addClass('dhe')
	})
	$('.del-row').unbind('mouseleave').mouseleave(function(){
		$(this).removeClass('dhe')
	})
	$('.del-row').unbind('click').click(function(){
		if($(this).parents('.summary-row').is(':first-child'))return
		var tid=$(this).parents('.summary-row').attr('id')
		deleteSummaryEntry(tid)
	})
	var nTB=$('.currentSummary .TotalBytes ').attr('value')
	if((nTB!==cTB)&&($('.currentSummary').attr('id')!=$('.summary-row').first().attr('id'))) saveSettings()
	var today=new Date()
	if(_cr_Date!=_rs_Date && _cr_Date.toDateString()==today.toDateString()){
		var bps=$('.summary-row').first().find('.TotalBytes').attr('value')/((_cr_Date-_rs_Date))
		var etb=bps*((_re_Date-_rs_Date))
		$('.summary-row').first().find('td').last().attr('value',etb).addClass('num').attr('id','estimatedMonthlyTotal').attr('title','Projected monthly total ')
		if($('#estimatedMonthlyTotal').attr('value')>Number($('#spUsageCap').text())*g_toGB){
			$('#estimatedMonthlyTotal').addClass('over-cap')
		}
}
	$('.is-cap')[g_nobwCap?'hide':'show']()
	setPercents('.summary-row', bw_cap)
	displayBytes('#SystemTotalsTable')

	$('.interval').unbind('click').click(function(){
		if($(this).parents('tr').hasClass('currentSummary')) return(false)
		$('.currentSummary').removeClass('currentSummary')
		$(this).parents('.summary-row').addClass('currentSummary')
		loadMonthly()
	})
	UsageHistoryChart()
	if(!$('.currentSummary').length) $('.summary-row').first().addClass('currentSummary')
	$('.nmBtn')[$('.currentSummary').is(':first-child')?'addClass':'removeClass']('disabled')
}
function UsageHistoryChart(){
	debugtrace("UsageHistoryChart",arguments,1)
	if($('.summary-row').length==1) return
	var data;
	data=new google.visualization.DataTable()
	data.addColumn('string','Billing Interval')
	data.addColumn('number','Downloads')
	data.addColumn('number','Uploads')
	data.addColumn('number','Projected')
	if(!g_nobwCap){
		data.addColumn('number','Usage Allowance')
		var cap=$('#bw_cap').val()*1
	}
	$('.summary-row').each(function(){
		var t=$(this).attr('id').split('-')
		var cI=t[0]+'-'+t[1]
		var up=Number(($(this).find('.uploads').attr('value')/g_toGB).toFixed(_dec))
		var down=Number(($(this).find('.downloads').attr('value')/g_toGB).toFixed(_dec))
		//var proj=isNaN($(this).find('td').last().text())?null:Number((($('#estimatedMonthlyTotal').attr('value')-$('.summary-row:first .TotalBytes ').attr('value'))/g_toGB).toFixed(_dec))
		var proj=$(this).is(':first-child')?(($('#estimatedMonthlyTotal').attr('value')-$('.summary-row:first .TotalBytes ').attr('value'))/g_toGB).toFixed(_dec)*1:null
		if(g_nobwCap){
			data.addRow([cI,down,up,proj])
		}
		else{
			data.addRow([cI,down,up,proj,cap])
		}
	})
	var ht=$('#summary-tab-section').height()
	var ht=300
	var baroptions={
		width:400,height:ht,seriesType: "bars",title:'Monthly Utilization',legend:{position:'top'},chartArea:{width:'80%',height:'40%'},isStacked:true,hAxis:{direction:-1,title:'Month',slantedText:true,titleTextStyle:{color:'green'},textStyle:{fontSize:9}},vAxis:{title:'GB',titleTextStyle:{color:'green'}},series:{0:{color:'blue',visibleInLegend:true},1:{color:'green',visibleInLegend:true},2:{color:'lightPink',visibleInLegend:true},3:{type: "line",color:'red',lineWidth:1,visibleInLegend:true}}
	};
	var UsageChart=new google.visualization.ColumnChart(document.getElementById('UsageGraph'))
	UsageChart.draw(data,baroptions)
}
function pnd(arr){
	debugtrace("pnd",arguments,2)
	var sut=!arr.uptime?null:arr.uptime
	if(arr.hour=='start'){
		pnd_data={start:{down:!sut?0:arr.down,up:!sut?0:arr.up},total:{down:0,up:0},usage:{}}
		p_pnd_d=arr.down
		p_pnd_u=arr.up
		o_sut=arr.uptime
		return
	}
	var svd=!sut?0:arr.down-p_pnd_d, svu=!sut?0:arr.up-p_pnd_u
	if(sut>o_sut||!o_sut){
		if(svd<0) svd+=Math.pow(2,32)-1
		if(svu<0) svu+=Math.pow(2,32)-1
		pnd_data.usage[arr.hour*1]={down:svd,up:svu}
	}
	else{
		svd=arr.down
		svu=arr.up
		pnd_data.usage[arr.hour*1]={down:svd,up:svu,restarted:true}
	}
	pnd_data.total.down+=svd
	pnd_data.total.up+=svu
	p_pnd_d=arr.down
	p_pnd_u=arr.up
	o_sut=arr.uptime
}
function cmu(mac){
	debugtrace("cmu",arguments,3)
	if(_unlimited_usage==0){
		monthly[mac]={down:0,up:0,usage:[]}
		for(var x=1;x<32;x++){
			monthly[mac].usage[x]={down:0,up:0}
		}
	}
	else{
		monthly[mac]={down:0,up:0,ul_down:0,ul_up:0,usage:[]}
		for(var x=1;x<32;x++){
			monthly[mac].usage[x]={down:0,up:0,ul_down:0,ul_up:0}
		}
	}
}
function tmv(m){
	debugtrace("tmv",arguments,3)
	var td=0,tu=0
	if(_unlimited_usage==1){
		var tud=0,tuu=0
	}
	var me=monthly[m]
	for(var x=1;x<32;x++){
		var wo=me.usage[x]
		td+=wo.down
		tu+=wo.up
		if(_unlimited_usage==1){
			tud+=wo.ul_down||0
			tuu+=wo.ul_up||0
		}
	}
	me.down=td
	me.up=tu
	if(_unlimited_usage==1){
		me.ul_down=tud
		me.ul_up=tuu
	}
}
function chu(mac){
	debugtrace("chu",arguments,3)
	hourly[mac].down=0
	hourly[mac].up=0
	if(_unlimited_usage==1){
		hourly[mac].ul_down=0
		hourly[mac].ul_up=0
	}
	if(_unlimited_usage==1){
		for(var hr=0;hr<24;hr++){
			hourly[mac].usage[hr]={down:0,up:0}
		}
	}
	else{
	   for(var hr=0;hr<24;hr++){
			hourly[mac].usage[hr]={down:0,up:0,ul_down:0,ul_up:0}
		}
	}
}
function hu(arr){
	debugtrace("hu",arguments,2)
	var mac=arr.mac.toUpperCase()
	check4Device(mac)
	if(!hourly[mac]){
		hourly[mac]={usage:[],down:0,up:0}
		chu(mac)
	}
	var hr=arr.hour*1
	hourly[mac].down+=arr.down*1
	hourly[mac].up+=arr.up*1
	hourly[mac].usage[hr].down+=arr.down*1
	hourly[mac].usage[hr].up+=arr.up*1
	if(_unlimited_usage==1){
		hourly[mac].ul_down+=(arr.ul_do*1||0)
		hourly[mac].ul_up+=(arr.ul_up*1||0)
		hourly[mac].usage[hr].ul_down+=(arr.ul_do*1||0)
		hourly[mac].usage[hr].ul_up+=(arr.ul_up*1||0)
	}
}
function serverloads(minL,minTS,maxL,maxTS){
	debugtrace("serverloads",arguments,2)
	var wm=200/Math.max(_processors*2,maxL)
	 $('#serverload').fadeIn('slow')
   
	$('#sp_minSL').text(minL.toFixed(2)).attr('title','Min load at: '+minTS)
	$('#sp_maxSL').text(maxL.toFixed(2)).attr('title','Max load at: '+maxTS)
	var l1=minL*wm-Math.max(20,$('#sp_minSL').width())/2,l2=maxL*wm-Math.max(20,$('#sp_maxSL').width())/2
	$('#sp_minSL').css('left',l1)
	$('#sp_maxSL').css('left',l2)
}
function loadHourly(cleardata){
	debugtrace("loadHourly",arguments,0)
	if(!cleardata) cleardata=false
	if(stillLoadingDevices){
		showLoading('Waiting for Devices to load...')
		setTimeout(function(){loadHourly(cleardata)},1500)
		return
	}
	($('.not-viewed').length==0) && $('#myAlert,.alert-icon').fadeOut('slow').removeClass('viewed')
	pnd_data={}
	o_sut=null
	$('#serverload').fadeOut('slow')
	$('.current-date').text(formattedDate(_cr_Date))
	showLoading('Loading Hourly data file...')
	$('.loaded').removeClass('loaded')
	Object.keys(hourly).forEach(function(k){
		chu(k)
	})
	$('#DailyData .is_u .num').attr('value',0)
	freeMem=0
	serverUptime=null
	availMem=null
	totMem=0
	disk_utilization="0%"
	var da=twod(_cr_Date.getDate()),dn=da*1
	var mo=twod(_cr_Date.getMonth()-(-1))
	var rm=twod(_rs_Date.getMonth()-(-1))
	var yr=_cr_Date.getFullYear()
	var ryr=_rs_Date.getFullYear()
	var od=typeof(_organizeData)=='undefined'?0:_organizeData
	var dp=$('#dataPath2').val()+(od==0?'':(od==1?ryr+'/':ryr+'/'+rm+'/'))
	var datafile=dp+yr+'-'+mo+'-'+da+'-'+$('#hourlyfile2').val()
	clearInterval(refreshTimer)
	var today=new Date()
	var isToday=_cr_Date.toDateString()==today.toDateString()
	if(isToday){
		if(_unlimited_usage==0){
			Object.keys(monthly).forEach(function(k){
				monthly[k].usage[dn].down=0
				monthly[k].usage[dn].up=0
			})
		}
		else{
			Object.keys(monthly).forEach(function(k){
				monthly[k].usage[dn].down=0
				monthly[k].usage[dn].up=0
				monthly[k].usage[dn].ul_down=0
				monthly[k].usage[dn].ul_up=0
			})
		}
 	}
	$.getScript(datafile)
	.done(function(dlist,textStatus){
		if (p_users_updated==''||!p_users_updated){}
		else if (users_updated>p_users_updated) {
			p_users_updated=''
			load_devices()
			loadMonthly()
			p_users_updated=users_updated
			return(false)
		}
		$('#uptime').text(!serverUptime?'n/a':sec2text(serverUptime))
		$('#sp_users_updated').text(lastmod(users_updated,'')).attr('title',users_updated)
		$('#sp_hourly_updated').text(lastmod(hourly_updated,'')).attr('title',hourly_updated)
		p_users_updated=users_updated
		var today=new Date()
		$('.hwncd').hide()
		if(isToday){
			monthly_totals.down-=monthly_totals.usage[dn].down
			monthly_totals.up-=monthly_totals.usage[dn].up
			monthly_totals.usage[dn].down=0
			monthly_totals.usage[dn].up=0
			if(_unlimited_usage==1){
				monthly_totals.ul_down-=monthly_totals.usage[dn].ul_down
				monthly_totals.ul_up-=monthly_totals.usage[dn].ul_up
				monthly_totals.usage[dn].ul_down=0
				monthly_totals.usage[dn].ul_up=0
 			}
			if(corrections[dn]){
				var cdown=corrections[dn].down*g_toMB, cup=corrections[dn].up*g_toMB
				monthly_totals.down+=cdown
				monthly_totals.up+=cup
				monthly_totals.usage[dn].down+=cdown
				monthly_totals.usage[dn].up+=cup
		   }

			Object.keys(hourly).forEach(function(k){
				if(!monthly[k]){
					if(_unlimited_usage==0){
						monthly[k]={usage:[],down:0,up:0}
					}
					else{
						monthly[k]={usage:[],down:0,up:0,ul_down:0,ul_up:0}
					}
					cmu(k)
				}
				monthly[k].usage[dn].down+=hourly[k].down
				monthly[k].usage[dn].up+=hourly[k].up
				var gn=devices[k].group.toLowerCase()
				if(!names[gn].usage[dn]){
					names[gn].usage[dn]={down:0,up:0}
					if(_unlimited_usage==1){
						names[gn].usage[dn].ul_down=0
						names[gn].usage[dn].ul_up=0
					}
				}
				names[gn].usage[dn].down+=hourly[k].down
				names[gn].usage[dn].up+=hourly[k].up
				monthly_totals.down+=hourly[k].down
				monthly_totals.up+=hourly[k].up
				monthly_totals.usage[dn].down+=hourly[k].down
				monthly_totals.usage[dn].up+=hourly[k].up
				if(_unlimited_usage==1){
					monthly[k].usage[dn].ul_down+=hourly[k].ul_down
					monthly[k].usage[dn].ul_up+=hourly[k].ul_up
					names[gn].usage[dn].ul_down+=hourly[k].ul_down
					names[gn].usage[dn].ul_up+=hourly[k].ul_up
					monthly_totals.ul_down+=hourly[k].ul_down
					monthly_totals.ul_up+=hourly[k].ul_up
					monthly_totals.usage[dn].ul_down+=hourly[k].ul_down
					monthly_totals.usage[dn].ul_up+=hourly[k].ul_up
				}
				tmv(k)
			})
			monthly_totals.pnd[dn]={down:pnd_data.total.down,up:pnd_data.total.up}
			refreshTimer=setInterval(refreshTimerFunc,1000)
			$('.hwncd').show()
			var maxHr=today.getHours()
		}
		else{
			var maxHr=24
			clearInterval(refreshTimer)
			$('.hwncd').hide()
		}
		var ry=_rs_Date.getFullYear(),rm=twod(_rs_Date.getMonth()-(-1)),rd=twod(_resetDay),bill=ry+'-'+rm+'-'+rd,mts=monthly_totals.up+';'+monthly_totals.down
		if(_unlimited_usage==1){
			mts+=';'+monthly_totals.ul_up+';'+monthly_totals.ul_down
		}
		if(!g_Settings['summaries'])g_Settings['summaries']={}
		g_Settings['summaries'][bill]=mts
		monthly_totals.usage.forEach(function(u,m){
			var p=monthly_totals.pnd[m]
			p.dn_d=p.down-u.down
			p.up_d=p.up-u.up
			p.dn_p=p.dn_d/u.down||0
			p.up_p=p.up_d/u.up||0
			p.t_p=(p.dn_d+p.up_d)/(u.down+u.up)||0
		})
		var du=(disk_utilization.replace('%','')*1).toFixed(_dec)
		var mf=totMem==0?0:((1-(freeMem)/totMem)*100).toFixed(_dec)
		if(!availMem){
			var data = google.visualization.arrayToDataTable([['Label','Value'],['Disk',du*1],['Memory',mf*1]])
			$('#serverload').css('left','666px')
			gauges.draw(data,gaugeOptions)
			$("#gauges td:nth-child(3)").remove()
		}
		else{
			var ma=totMem==0?0:((1-(availMem)/totMem)*100).toFixed(_dec)
			var data = google.visualization.arrayToDataTable([['Label','Value'],['Disk',du*1],['Avail.',ma*1],['Memory',mf*1]])
			$('#serverload').css('left','600px')
			gaugeOptions.width=300
			gauges.draw(data,gaugeOptions)
		}
		$("#gauges td:first").attr('Title','Disk Utilization: '+du+'%')
		$("#gauges td:nth-child(2)").attr('Title','Available Memory: '+ma+'% ('+availMem+' bytes)')
		$("#gauges td:last").attr('Title','Memory Utilization: '+mf+'% ('+freeMem+' bytes free)')

		setSummaryTotals()
		nHourlyReadFailures=0
		loadView(cleardata)
		changelegend()
		
		var restartStr='',comma=''
		for(var x=0;x<maxHr;x++){
			if(!pnd_data||!pnd_data.usage||!pnd_data.usage[x*1]||pnd_data.usage[x*1].restarted){
				restartStr+=comma+x+'-'+(x+1)
				comma=', '
			}
		}

		(restartStr!='')&&($('#ShowRD').is(':checked'))&&ShowAlert("Your Hourly usage file is missing some or all of the `measured at the router` data "+(isToday?'today': 'on '+formattedDate(_cr_Date))+" during the hours: "+restartStr+".<br>This could be caused by your internet connection being down, your router being restarted and/or the YAMon script not running.",'missing')
	})
	.fail(function(jqxhr,settings,exception){
		nHourlyReadFailures++
		var msg='Error #'+nHourlyReadFailures+' reading the hourly data file: `<a href="'+datafile+'" target="_blank">'+datafile+'</a>`\n'+exception
		if(nHourlyReadFailures>3){
			ShowAlert(msg,'hourly-error')
			nHourlyReadFailures=0
			clearInterval(refreshTimer)
		}
		else{
			setTimeout(function(){loadHourly(cleardata)},1500)
			return
		}
		loadView(cleardata)
		changelegend()
	})
	.complete(function(dlist,textStatus) {
		clearLoading()
	})
}
function refreshDevices(){
	if($('#devices-tab').hasClass('not-selected')) return
	debugtrace("refreshDevices",arguments,0)
	var ul_redtot=$('#ul-redtot').is(':checked')?1:0
	var dt_total=0
	$('#devices-tab').removeClass('loaded')
	$('.achanged').removeClass('achanged')
	Object.keys(devices).sort(byName).forEach(function(d){
		var id=devices[d].id,nm=!monthly[d],dn=nm?0:monthly[d].down*1,up=nm?0:monthly[d].up*1,tot=dn+up
		if(_unlimited_usage==1){
			var ul_up=nm?0:monthly[d].ul_up*1,ul_dn=nm?0:monthly[d].ul_down*1,tot=up+dn-(ul_up+ul_dn)*ul_redtot
		}
		var cs_edit=!g_Settings['devices'][d]?'':' cs_edit'
		var tcolour=devices[d].colour==''?colours_list[devices[d].n]:devices[d].colour
		if($('#dd-'+id).length==0){
			var ud=devices[d].name
			var u_d=clean(ud), is_z=tot==0?' is_z':''
			var nr=$('<tr/>').attr('id','dd-'+id).addClass('is_dd'+is_z+cs_edit)
			nr.append($('<td/>').addClass('group').text(devices[d].group))
			nr.append($('<td/>').addClass('deviceName').html("<span style='background-color:"+tcolour+"' class='legend-colour'></span><span class='thedevice'>"+ud+'</span>'))
			nr.append($('<td/>').addClass('deviceIP').text(devices[d].ip))
			nr.append($('<td/>').addClass('deviceMAC').text(d))
			nr.append($('<td/>').addClass('TotalBytes br2 num').attr('value',tot).text(0))
			nr.append($('<td/>').addClass('percent br2').text(0))
			nr.append($('<td/>').addClass('updated a-c br').text(lastmod(devices[d].updated,devices[d].added)).attr('title',devices[d].updated))
			nr.append($('<td/>').addClass('edit-d').html("&nbsp;").attr('title','Click to edit the owner/name/colour for this device'))
			$("#devicesData").append(nr)
		}
		else{
			ud_r(d)
		}
		dt_total+=tot
	})
	$('#devicesData .group').unbind('click').click(function(){
		var u_n=clean($(this).text())
		$('#mb-filter').val('dd-'+u_n).change()
	})
	$('#devicesData .edit-d').unbind('click').click(function(e){
		if($(this).hasClass('writing')){
			$('.ed-close').click()
			e.stopPropagation()
			return
		}
		$('.writing').removeClass('writing')
		var wr=$(this).parents('tr'),mac=wr.find('.deviceMAC').text(),mac_i=mac.split('-')
		$('#ed-mac').text(mac)
		$('#ed-key').val(mac_i[1])
		$('#ed-owner').val(wr.find('.group').text())
		$('#ed-name').val(wr.find('.deviceName').text())
		$('.ed-key')[!mac_i[1]?'hide':'show']() 
		$('#ed-colour').val(devices[mac].colour)
		if(!g_Settings['devices'][mac]){
			$('#ed-clear').hide()
			$('#ed-update').text('Add')
		}
		else{
			$('#ed-clear').show()
			$('#ed-update').text('Update')
		}
		$('.bad_value').removeClass('bad_value')
		$('#edit-device').slideDown('slow')
		$(this).addClass('writing')
		e.stopPropagation()
	})
	$('#devicesData tr').unbind('click').click(function(){
		if($(this).find('.edit-d').hasClass('writing')){
			$('.ed-close').click()
			return
		}
		if($(this).hasClass('writing-row')){
			$('.ed-close').click()
			return
		}
		$('.writing').removeClass('writing')
		$('.writing-row').removeClass('writing-row')
		$(this).addClass('writing-row')
		var wr=$(this),mac=wr.find('.deviceMAC').text()
		$('#ed-mac').text(mac)
		$('#ed-owner').val(wr.find('.group').text())
		$('#ed-name').val(wr.find('.deviceName').text())
		$('#ed-colour').val(devices[mac].colour)
		if(!g_Settings['devices'][mac]){
			$('#ed-clear').hide()
			$('#ed-update').text('Add')
		}
		else{
			$('#ed-clear').show()
			$('#ed-update').text('Update')
		}
		$('.bad_value').removeClass('bad_value')
		$('#edit-device').slideDown('slow')
		wr.find('.edit-d').addClass('writing')
	})

	$('#devicesData .thedevice ').unbind('click').click(function(e){
		var u_n=clean($(this).parents('tr').find('.group').text())
		var d_n=clean($(this).text())
		$('#mb-filter').val('dd-'+u_n+'-'+d_n).change()
		e.stopPropagation() 
	})
	$('#sp_num_devices').text($('.is_dd').length)
	var nad=$('.is_dd').length-$('.is_dd.is_z').length
	$('#sp_num_active_devices').text(nad==0?'None':(nad==$('.is_dd').length?'All':nad))
	$('#dt_total').attr('value',dt_total)
	setPercents('#devicesData tr', dt_total)
	displayBytes('#devices-table')
}
function monthlyBreakdown(){
	debugtrace("monthlyBreakdown",arguments,0)

	$("#mb-filter .ddl-d").each(function(){
	var mac=$(this).attr('id').split('-')[1]
		$(this)[!monthly[mac]?'hide':'show']()
	})
	var today=new Date()
	var mbfs=$("#mb-filter option:selected")
	if(mbfs.hasClass('ddl-d')){
		var mac=mbfs.attr('id').split('-')[1]
		var dataset=monthly[mac].usage
	}
	else if(mbfs.hasClass('ddl-u')){
		var name=mbfs.attr('id').split('-')[1]
		var dataset=names[name].usage
	}
	else{
		var dataset=monthly_totals.usage
	}
	var inc_all=$('#mb-filter').val()=='ALL',inc_isp=inc_all&&$('#showISP').is(':checked'),inc_rd=inc_all&&$('#ShowRD').is(':checked')
	var mo=twod(_rs_Date.getMonth()+1),yr=_rs_Date.getFullYear()
	if(!g_Settings['isp'][mo+'-'+yr]){
		var isp_totals={}
	}
	else{
		var isp_totals=JSON.parse(g_Settings['isp'][mo+'-'+yr])
	}
	var cTot=0,tup=0
	var dtot=0,utot=0,ul_dtot=0,ul_utot=0,isp_d=0,isp_dd=0,isp_dp=0,isp_u=0,isp_ud=0,isp_up=0,isp_dct=0,isp_uct=0,isp_t,isp_td,isp_tp,isp_dv=0,isp_uv=0,isp_tv=0,isp_rtv=0,isp_ct=0,isp_rct=0
	var rd_d=0,rd_u=0,rd_dv=0,rd_uv=0,rd_dct=0,rd_uct=0,rd_tv=0,rd_ct=0,rd_fdt=0,rd_fut=0,rd_ft=0,isp_fdt=0,isp_fut=0,isp_ft=0
	var ul_redtot=$('#ul-redtot').is(':checked')?1:0, sd=new Date(_rs_Date)
	var is_det=$('#isp_details').hasClass('sel'),is_dif=$('#isp_diff').hasClass('sel'),is_per=$('#isp_percent').hasClass('sel'),isp_f
	var rd_det=$('#rd_details').hasClass('sel'),rd_dif=$('#rd_diff').hasClass('sel'),rd_per=$('#rd_percent').hasClass('sel'),rd_f

	for (var d=sd; d <= _re_Date; d.setDate(d.getDate() + 1)) {
		var dn=d.getDate(),ds=d.getFullYear()+'-'+twod(d.getMonth()+1)+'-'+twod(d.getDate()),uid="mbd-"+ds,nds=!dataset[dn]
		var down=nds?0:dataset[dn].down,up=nds?0:dataset[dn].up,ul_down=nds?0:dataset[dn].ul_down||0,ul_up=nds?0:dataset[dn].ul_up||0,dt=down+up-(ul_down+ul_up)*ul_redtot
		cTot+=dt
		dtot+=down
		utot+=up
		ul_dtot+=ul_down
		ul_utot+=ul_up
		var fd=d>today?' hidden':''
		if(!inc_all||!monthly_totals.pnd||!monthly_totals.pnd[dn]){
		}
		else{ 
			var flagged=monthly_totals.pnd[dn].reboots>0?' flagged':'' 
			var flaggedtxt=monthly_totals.pnd[dn].reboots>0?' The router was rebooted at least '+(monthly_totals.pnd[dn].reboots==1?'once':(monthly_totals.pnd[dn].reboots+' times'))+' on this date.':''
			var mtdn=monthly_totals.pnd[dn]

			rd_d=mtdn.down*1
			rd_u=mtdn.up*1

			if(rd_det){
				rd_dv=mtdn.down
				rd_uv=mtdn.up
				rd_tv=rd_dv+rd_uv
				rd_ct+=rd_tv
				rd_fdt+=rd_dv
				rd_fut+=rd_uv
				rd_ft=rd_fdt+rd_fut
				rd_f=' num'
			}
			else if(rd_dif){
				rd_dv=mtdn.dn_d
				rd_uv=mtdn.up_d
				rd_tv=rd_dv+rd_uv
				rd_ct+=rd_tv
				rd_fdt+=rd_dv
				rd_fut+=rd_uv
				rd_ft=rd_fdt+rd_fut
				rd_f=' num'
			}
			else if(rd_per){
				rd_dct+=rd_d
				rd_uct+=rd_u
				rd_dv=(mtdn.dn_p*100).toFixed(1)
				rd_uv=(mtdn.up_p*100).toFixed(1)
				rd_tv=(mtdn.t_p*100).toFixed(1)
				rd_ct='-'
				rd_f=' percent'
	
				rd_fdt=((rd_dct-dtot)/Math.max(dtot,1)*100).toFixed(1)
				rd_fut=((rd_uct-utot)/Math.max(utot,1)*100).toFixed(1)
				rd_ft=((rd_dct-dtot+rd_uct-utot)/Math.max(dtot+utot,1)*100).toFixed(1)
 				rd_ct=rd_ft
   }

		}
		if(!inc_all||!isp_totals[dn]){
			isp_d='-';isp_dd='-';isp_dp='-';isp_dv='-'
			isp_u='-';isp_ud='-';isp_up='-';isp_uv='-'
			isp_td='-';isp_tp='-';isp_tv='-'
		}
		else{ 
			isp_d=isp_totals[dn].down*1
			isp_u=isp_totals[dn].up*1
			isp_dd=isp_d-down
			isp_ud=isp_u-up
			isp_dp=((isp_d-down)/Math.max(down,1)*100).toFixed(1)
			isp_dp=((isp_d-down)/Math.max(down,1)*100).toFixed(1)
			isp_up=((isp_u-up)/Math.max(up,1)*100).toFixed(1)
			isp_dct+=isp_d
			isp_uct+=isp_u
			
			if(is_det){
				isp_dv=isp_d
				isp_uv=isp_u
				isp_tv=isp_d+isp_u
				isp_ct+=isp_d+isp_u
				isp_f=' num'
				isp_fdt+=isp_dv
				isp_fut+=isp_uv
				isp_ft=isp_fdt+isp_fut
			}
			else if(is_dif){
				isp_dv=isp_dd
				isp_uv=isp_ud
				isp_tv=isp_dd+isp_ud
				isp_ct+=isp_dd+isp_ud
				isp_f=' num'
				isp_fdt+=isp_dv
				isp_fut+=isp_uv
				isp_ft=isp_fdt+isp_fut
			}
			else if(isp_percent){
				isp_dv=isp_dp
				isp_uv=isp_up
				isp_rtv=(isp_d-down+isp_u-up)/Math.max(down+up,1)
				isp_tv=(isp_rtv*100).toFixed(1)
				isp_rct=(isp_dct-dtot+isp_uct-utot)/Math.max(dtot+utot,1)
				isp_ct=(isp_rct*100).toFixed(1)
				isp_f=' percent'
				isp_fdt=((isp_dct-dtot)/Math.max(dtot,1)*100).toFixed(1)
				isp_fut=((isp_uct-utot)/Math.max(utot,1)*100).toFixed(1)
				isp_ft=isp_ct
			}

		}
		if($('#'+uid).length==0){
			var nr=$('<tr/>').attr('id',uid).addClass('mb-row'+fd)
			nr.append($('<td/>').addClass('mbd-date a-r br'+flagged).text(formattedDate(d)).attr('title',flaggedtxt))
			nr.append($('<td/>').addClass('downloads num').attr('value',down))
			nr.append($('<td/>').addClass('uploads num br').attr('value',up))
			nr.append($('<td/>').addClass('isUL ul-down num').attr('value',ul_down))
			nr.append($('<td/>').addClass('isUL ul-up num br').attr('value',ul_up))
			nr.append($('<td/>').addClass('TotalBytes br num').attr('value',dt))
			nr.append($('<td/>').addClass('aggTot num br2').attr('value',cTot*(dt>0)))
			
			nr.append($('<td/>').addClass('is-isp num i-d'+isp_f).attr('value',isp_dv).attr('v',isp_d).attr('d',isp_dd).attr('p',isp_dp))
			nr.append($('<td/>').addClass('is-isp num i-u br'+isp_f).attr('value',isp_uv).attr('v',isp_u).attr('d',isp_ud).attr('p',isp_up))
			nr.append($('<td/>').addClass('is-isp num i-t br2'+isp_f).attr('value',isp_tv))
			nr.append($('<td/>').addClass('is-isp num i-ct br2'+isp_f).attr('value',isp_ct))
			
			nr.append($('<td/>').addClass('is-rd num r-d'+rd_f).attr('value',rd_dv))
			nr.append($('<td/>').addClass('is-rd num r-u br'+rd_f).attr('value',rd_uv))
			nr.append($('<td/>').addClass('is-rd num r-t br2'+rd_f).attr('value',rd_tv))
			nr.append($('<td/>').addClass('is-rd num r-ct br2'+rd_f).attr('value',rd_ct))

			$('#MonthlyBreakdown').append(nr)
		}
		else{
			var arr=[[' .downloads',down],[' .uploads',up],[' .ul-down',ul_down],[' .ul-up',ul_up],[' .TotalBytes',dt],[' .aggTot',cTot]]
			if(inc_isp){	 
				$('#'+uid+' .is-isp').removeClass('percent isNull Kbytes MBytes GBytes').addClass(isp_f)
				arr.push([' .i-d',isp_dv],[' .i-u',isp_uv],[' .i-t',isp_tv],[' .i-ct',isp_ct])
			}
			if(inc_rd){	 
				$('#'+uid+' .is-rd').removeClass('percent isNull Kbytes MBytes GBytes').addClass(rd_f)
				arr.push([' .r-d',rd_dv],[' .r-u',rd_uv],[' .r-t',rd_tv],[' .r-ct',rd_ct])
			}
			updateRow(uid,arr)
		}
	}
 	var mo=twod(_cr_Date.getMonth()+1),yr=_cr_Date.getFullYear()
	for(var day in corrections){
		var c_u=corrections[day].up*1,c_d=corrections[day].down*1,desc=corrections[day].desc+' (download -> '+c_d+'MB; upload -> '+c_u+'MB)'
		$('#mbd-'+yr+'-'+mo+'-'+twod(day)+' .mbd-date').addClass('corrected').attr('title',desc)
	}
	if($('#breakdownFooter').html().length==0){
		var nr=$('<tr/>').attr('id','bdFooter')
		nr.append($('<td/>').text(':::Totals:::').addClass('a-r br'))
		nr.append($('<td/>').addClass('downloads num').attr('value',dtot))
		nr.append($('<td/>').addClass('uploads num br').attr('value',utot))
		nr.append($('<td/>').addClass('isUL ul-down num').attr('value',ul_dtot))
		nr.append($('<td/>').addClass('isUL ul-up num br').attr('value',ul_utot))
		nr.append($('<td/>').addClass('TotalBytes br2 num').attr('value',cTot))
		nr.append($('<td/>').text('-').addClass('a-c br2'))
		nr.append($('<td/>').addClass('is-isp isp-dt downloads num'+isp_f).attr('value',isp_fdt))
		nr.append($('<td/>').addClass('is-isp isp-ut uploads num br'+isp_f).attr('value',isp_fut))
		nr.append($('<td/>').addClass('is-isp isp-t TotalBytes num br2'+isp_f).attr('value',isp_ft))
		nr.append($('<td/>').text('-').addClass('is-isp a-c br2'+isp_f))

		nr.append($('<td/>').addClass('is-rd r-d downloads num'+rd_f).attr('value',rd_fdt))
		nr.append($('<td/>').addClass('is-rd r-u uploads num br'+rd_f).attr('value',rd_fut))
		nr.append($('<td/>').addClass('is-rd r-t td-t TotalBytes num br2'+rd_f).attr('value',rd_ft))
		nr.append($('<td/>').text('-').addClass('is-rd a-c br2'+rd_f))
		$('#breakdownFooter').append(nr)
	}
	else{
		var arr=[[' .downloads',dtot], [' .uploads',utot], [' .ul-down',ul_dtot], [' .ul-up',ul_utot], [' .TotalBytes',cTot]]
		if(inc_isp){	 
			$('#bdFooter .is-isp').removeClass('percent isNull Kbytes MBytes GBytes').addClass(isp_f)
			arr.push([' .isp-dt',isp_fdt],[' .isp-ut',isp_fut],[' .isp-t',isp_ft])
		}
		if(inc_rd){	 
			$('#bdFooter .is-rd').removeClass('percent isNull Kbytes MBytes GBytes').addClass(rd_f)
			arr.push([' .r-d',rd_fdt],[' .r-u',rd_fut],[' .r-t',rd_ft])
		} 
		updateRow('bdFooter',arr)
	}
	displayBytes('#MonthlyBreakdown,#breakdownFooter')
	$('.mbd-date').unbind('click').click(function(){
		var dt=$(this).parent('tr').attr('id').split('-')
		_cr_Date=new Date(dt[1],dt[2]-1,dt[3])
		loadHourly(true)
		$('#daily-tab').removeClass('loaded').click()
	})
	$('#Monthly-breakdown-table .is-isp')[inc_isp&&inc_all?'removeClass':'addClass']('hidden');
	$('.is-rd')[inc_rd&&inc_all?'removeClass':'addClass']('hidden');
	$('.isUL')[_unlimited_usage==1?'show':'hide']()
	drawGraphs()
}