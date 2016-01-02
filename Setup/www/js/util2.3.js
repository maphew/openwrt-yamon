"use strict"
/*
##########################################################################
# Yet Another Monitor (YAMon)											 #
# Copyright (c) 2013-2014 Al Caughey									 #
# All rights reserved.													 #
# See `yamon.js` for more T&C's											 #
##########################################################################
*/
Object.getPrototypeOf(localStorage).find = function(s) {
	var r=[]
	Object.keys(localStorage).forEach(function(k){
		if (k.indexOf(s)==-1) return
		r.push({'key':k,'value':localStorage.getItem(k)});
	});
	return r.sort(function(a, b) { return (a.key < b.key?1:(a.key > b.key?-1:0)); });
}
function loadSettings(){
	debugtrace("loadSettings",g_Settings,3)
	g_Settings=JSON.parse(localStorage.getItem('Settings'))||{}
	showLoading('Loading Settings...')
	$('#dbkey-sharing').hide()
	if(typeof(_dbkey)=='undefined'){
		$('#dbkey-clicked').hide()

		$('#dbkey,#sv-btn').hide()
		checkConfig()
		setSettingsDefaults() 
		setGlobals()
		setButtonsActions()
		setViews()
		if(_doLiveUpdates==1&&$('#showLive').is(':checked')){
			setUpLiveCharts()
		}
	}
	else{
		$('#dbkey').val(_dbkey)
		$('#settings-tab').addClass('db')
		showLoading('Loading Settings from database...')
		var domain='http://usage-monitoring.com'
		if(g_Settings['useHTTPS']) domain='https://usagemonitoringcom.ipage.com'
		var request = $.ajax({
			url: domain+"/db/loSettings.php",
			type: "POST",
			data: {db:_dbkey},
			dataType: "json"
		});
		request.done(function( data ) {
			if (data.response == 'success') {
				g_Settings=JSON.parse(data.results.values)||{}
				$('#getKey, #dbkey-needtoclick, #dbkey-clicked').remove()
				$('#dbkey-sharing').show()
			}
			else if (data.response == 'error') {
				alert( data.comment );
				g_Settings=JSON.parse(localStorage.getItem('Settings'))||{}
			}
		});
		request.fail(function( jqXHR, textStatus ) {
			alert( "Request failed: " + textStatus );
		});
		request.complete(function( jqXHR, textStatus ) {
			checkConfig()
			setSettingsDefaults() 
			setGlobals()
			setButtonsActions()
			setViews()
			if(_doLiveUpdates==1&&$('#showLive').is(':checked')){
				setUpLiveCharts()
			}	   
		});
	}
}
function checkConfig(){
	debugtrace("checkConfig",arguments,1)
	if(!g_Settings['devices'])g_Settings['devices']={}
	if(!_settings_pswd)
		$('#d-settings_pswd').hide()
	else if(_settings_pswd==g_Settings['settings_pswd']){
		$('#d-settings_pswd').hide().siblings().show()
		$('#missing-txt').hide()
	}
	else
		 $('#d-settings_pswd').show().siblings().hide()

	if (!g_Settings['complete']==1) return
	var config_issues=''
	config_issues+=(config_issues==''?'':'\n')+checkLSValue('reset_day2', _ispBillingDay, 'ISP Billing Date')
	config_issues+=(config_issues==''?'':'\n')+checkLSValue('dataPath2', _wwwData, 'Path to Data')
	config_issues+=(config_issues==''?'':'\n')+checkLSValue('devicefile2', _usersFileName, '`Users & Devices` file name')
	config_issues+=(config_issues==''?'':'\n')+checkLSValue('usagefile2', _usageFileName, '`Usage` file name')
	var t_lu=g_Settings['showLive']?1:0
	if(t_lu!=_doLiveUpdates){
	   config_issues+=(config_issues==''?'':'\n')+'- Show Live Updates checkbox value ('+t_lu+') does not match the value of `_doLiveUpdates` ('+_doLiveUpdates+')'
	}
	if(_doLiveUpdates==1){
		if(g_Settings['showLive']=='true'&&(g_Settings['liveFileName']!=_liveFileName)){
			if(localStorage.getItem('_liveFileName')&&!localStorage.getItem('liveFileName')){
				localStorage.removeItem('_liveFileName')
			}
			if(!g_Settings['liveFileName']){
				g_Settings['liveFileName']=_liveFileName
			}
			else{
				config_issues+=(config_issues==''?'':'\n')+'- Live data file name (`'+g_Settings['liveFileName']+'`) does not match the value of `_liveFileName` (`'+_liveFileName+'`)'
			}
		}
	}
	var onlyUpdate=g_Settings['onlyUpdate']
	if(onlyUpdate==undefined){
	}
	else if(onlyUpdate=='1'){
		$('#onlyUpdate-y').prop('checked','checked')
	}
	else{
		$('#onlyUpdate-n').prop('checked','checked')
	}
	if(config_issues!=''){
		 var msg=("Uh-oh!  There are some discrepancies between your saved report settings and the values in your `config.file`!  If you are viewing these reports for the first time, don't worry the next screen will help you resolve the errors highlighted below.\n\n"+config_issues+"\n\nPlease check your inputs on the `Settings` tab and ensure they match what you have in your `config.file`!")
		 ShowAlert(msg,'config-error')
	}
}
function twod(v){
	debugtrace("twod",arguments,2)
	return ('0'+Number(v)).slice(-2)
}
function checkLSValue(key, val, msg){
	debugtrace("checkLSValue",arguments,2)
	if(g_Settings[key]==null || g_Settings[key]!=val)
 	   return '- '+msg+' has no value or does not match the configuration value.  It must be set to `'+val+'` (currently set to `'+g_Settings[key]+'`)'
	else {
		return ''
	}
}
function updateLSStorage(){
	debugtrace("updateLSStorage",arguments,2)
	var tis=localStorage.find('v2summary')
	showLoading('Updating data storage format...')
	if(!g_Settings['summaries']) g_Settings['summaries']={}
	Object.keys(tis).forEach(function(k){
		var ws=tis[k].key.replace('v2summary-',''), wv=tis[k].value
		g_Settings['summaries'][ws]=wv
		localStorage.removeItem(tis[k].key)
	})
	var tis=localStorage.find('isp-')
	if(!g_Settings['isp']) g_Settings['isp']={}
	Object.keys(tis).forEach(function(k){
		var ws=tis[k].key.replace('isp-',''), wv=tis[k].value
		g_Settings['isp'][ws]=wv
		localStorage.removeItem(tis[k].key)
	})
	var tis=localStorage.find('bd_graphs')
	if(!g_Settings['graphs']) g_Settings['graphs']={}
	Object.keys(tis).forEach(function(k){
		var ws=tis[k].key.replace('graphs',''), wv=tis[k].value
		g_Settings['isp'][ws]=wv
		localStorage.removeItem(tis[k].key)
	})
	$('#dataPath2,#usagefile2,#devicefile2,#hourlyfile2,#liveFileName,#hmUpdateRows').each(function(){
		localStorage.removeItem($(this).attr('id'))
	})
}
function setSettingsDefaults(){
	debugtrace("setSettingsDefaults",arguments,1)
	updateLSStorage()
	$('#reset_day2').val(g_Settings['reset_day2']||_ispBillingDay)
	_resetDay=$('#reset_day2').val()
	$('.reset_day2').html(_resetDay+'<sup>'+((_resetDay%10==1)?'st':((_resetDay%10==2)?'nd':((_resetDay==3)||(_resetDay==23)?'rd':'th')))+'</sup>')
	var bw_cap=g_Settings['bw_cap']||null
	if(bw_cap==null){
		$('#bandwidth-u').prop('checked','checked')
		$('#spUsageCap').text('Unlimited').removeClass('GBytes')
	}
	else{
		$('#bandwidth-l').prop('checked','checked')
		$('#spUsageCap').text(bw_cap).addClass('GBytes')
		$('#bw_cap').val(bw_cap)
	}
	$('#DisplayUnits').val(g_Settings['DisplayUnits']||'auto');
	var du=$("#DisplayUnits").val()
	$('.change-units a')[du=='auto'?'first':'last']().removeClass('hidden')
	$('.change-units a').click(function(){
		changeUnits(this)
	})
	$("#spBandwidth").html(du=="auto"?"automatically sized.":'in '+dispUnits[du]+'ytes.');
	$('#DisplayBase').val(g_Settings['DisplayBase']||'1024');
	$('#NumDecimals').val(g_Settings['NumDecimals']||'1');
	_dec=$("#NumDecimals").val();
	$('#ShowZeroes,#ShowDevices,#showLive,#showISP').each(function(){
		$(this).prop('checked',eval(g_Settings[$(this).attr('id')]));
	})
	var sz=$('#ShowZeroes').is(':checked')
	$('.nad').text(sz?'Hide Zeroes':'Show All')

	$('.u-d').addClass($('#ShowDevices').is(':checked')?'c-d':'c-u')
	$('#dataPath2').val(g_Settings['dataPath2']||_wwwData)
	$('#devicefile2').val(g_Settings['devicefile2']||_usersFileName)
	$('#usagefile2').val(g_Settings['usagefile2']||_usageFileName)
	$('#hourlyfile2').val(g_Settings['hourlyfile2']||_hourlyFileName)
	$('#showLive').prop('checked',(g_Settings['showLive']||_doLiveUpdates)==1)
	$('#cb-dl-o').prop('checked',(g_Settings['cb-dl-o']))
	updateSettings('showLive',(g_Settings['showLive']||_doLiveUpdates)==1)
	$('#showLive,#showISP').each(function(){
		$('.'+$(this).attr('id'))[$(this).is(':checked')?'removeClass':'addClass']('hidden')
	})
	$('#liveFileName').val(g_Settings['liveFileName']||'live_data.js')
	$('#hmUpdateRows').val(g_Settings['hmUpdateRows']||15)
	$('#RefreshInterval').val(g_Settings['RefreshInterval']||'120')
	$('#settings_pswd').val(g_Settings['settings_pswd_clear']||'')
	$('.RefreshInterval').text($('#RefreshInterval').val());
	$('#isp-name').val(g_Settings['isp-name']||'ISP');
	$('.isp-name').text($('#isp-name').val());
	$('#isp-url').val(g_Settings['isp-url']);
	$('#dateFMT').val(g_Settings['dateFMT']||1);
	$('#dateSep').val(g_Settings['dateSep']||' ');
	$('#useHTTPS').prop('checked',g_Settings['useHTTPS']||false);
	$('#autoSave').prop('checked',g_Settings['autoSave']||false);
	$('#DailyFooter,#MonthlyFooter,#devicesFooter').addClass('ftotals');
	$('.cf-desc').before('<span class="legend-colour" title="Click to add/remove this device from the Hourly Graph below" style="background-color:black">');
	$('.data-view,.settings-section').addClass('hidden')
	var ul_redtot=g_Settings['ul-redtot']||false
	$('#ul-redtot').prop('checked',ul_redtot||ul_redtot=='true')
	$('.th-tot').html('Totals' +(_unlimited_usage=='0'?'':(' ('+($('#ul-redtot').is(':checked')?'less':'including') + ' Unlimited)')))
	$('.isp-url').prop('href',$('#isp-url').val());
	$('.required').parents('p').each(function(){
		if($(this).attr('id')==undefined)return
		var id=$(this).attr('id').split('-')[1]
		if(g_Settings[id]==undefined){
			$(this).append("<span class='mval check' title='Click to accept this value'>[&nbsp;&#x2714;&nbsp;]</span>")
			$('#'+id).addClass('mval')
		}
		var mc=$('.mval.check').length
		$('#missing-txt').text("You are currently missing "+ mc +" required value"+(mc==1?'':'s')+".")
	})
	$('.mval.check').click(function(){
		var id=$(this).parents('p').attr('id').split('-')[1]
		if(id=='reset_day2'&&($('#reset_day2').val()==undefined||$('#reset_day2').val()==''||isNaN($('#reset_day2').val())||$('#reset_day2').val()<0||$('#reset_day2').val()>31)){
			alert("Sorry this field cannot be empty and must be between [1-31]!")
			$('#'.id).focus()
			return false
		}
		else if(id=='bw_cap'&&g_nobwCap){ 
		}
		else if(id=='bw_cap'&&!g_nobwCap&&($('#bw_cap').val()==undefined||$('#bw_cap').val()==''||isNaN($('#bw_cap').val())||$('#bw_cap').val()<0)){
		}
		else if($('#'+id).val()==''){
			alert("Sorry this field cannot be empty!")
			$('#'.id).focus()
			return false
		}
		updateSettings(id,$('#'+id).val())
		$(this).parents('p').find('.mval').removeClass('mval')
		$(this).remove()
		var mc=$('.mval.check').length
		$('#missing-txt').text("You are currently missing "+ mc +" required value"+(mc==1?'':'s')+".")
		if(mc==0){
			updateSettings('complete',1)
			saveSettings2db()
			alert("Congratulations, all required values have now been specified.  The page will now reload.")
			window.location.reload()
		}
	})
	if(_doLiveUpdates==1){
		s_usage=new google.visualization.DataTable();
		s_usage.addColumn('string','Time');
		s_usage.addColumn('number','1-min');
		s_usage.addColumn('number','5-min');
		s_usage.addColumn('number','15-min');
		livekbs_do=new google.visualization.DataTable();
		livekbs_do.addColumn('string','Time');
		livekbs_do.addColumn('number','downloads');
		livekbs_do.addColumn('number','ave. downloads');
		livekbs_up=new google.visualization.DataTable();
		livekbs_up.addColumn('string','Time');
		livekbs_up.addColumn('number','uploads')
		livekbs_up.addColumn('number','ave. uploads');
	}
	$('#ShowRD').prop('checked',g_Settings['ShowRD']); 
	$('#active-connections')[_doCurrConnections==1?'show':'hide']()
	$('.ddp').removeClass('sel')
	$('#'+(g_Settings['is-isp-ddp']||'isp_details')).addClass('sel')
	$('#'+(g_Settings['is-rd-ddp']||'rd_details')).addClass('sel')
	$('#fadeNotices').val(g_Settings['fadeNotices']||'5');
	$('#isp-format').val(g_Settings['isp-format']||'0').change();
	$('#isp-section table').hide()
	$('#isp-'+$('#isp-format').val()).show()
}
function setGlobals(){
	debugtrace("setGlobals",arguments,1)
	g_base=$("#DisplayBase").val();
	g_toKB=Math.pow(g_base,1)
	g_toMB=Math.pow(g_base,2)
	g_toGB=Math.pow(g_base,3)
	g_nobwCap=$('#bandwidth-u').is(':checked')
}
function setButtonsActions(){
	debugtrace("setButtonsActions",arguments,1)
	$('.settings-tab').first().siblings('.settings-tab').addClass('not-selected')
	$('.settings-tab').click(function(){
		$(this).siblings('.settings-tab').addClass('not-selected');
		$(this).removeClass('not-selected');
		var tab_id= '#'+$(this).attr('id')+'-section';
		$(tab_id).removeClass('hidden').siblings().addClass('hidden');
		$('#collapse-summary').removeClass('collapsed')
	})
	$('.data-view-name').first().siblings('.data-view-name').addClass('not-selected')
	$('.data-view-name').click(function(){
		$(this).siblings('.data-view-name').addClass('not-selected');
		$(this).removeClass('not-selected');
		var tab_id= $(this).attr('id');
		$('#'+tab_id+'-section').removeClass('hidden').siblings().addClass('hidden');
		(tab_id!='live-tab') && clearInterval(liveUpdatesTimer);
		(!$('#'+tab_id).hasClass('loaded')) && loadView(false)
		
	})
	$('#collapse-summary').click(function(){
		var wt=$('.settings-tab').not('.not-selected').attr('id')
		if($(this).hasClass('collapsed')){
			$(this).removeClass('collapsed')
			$('#'+wt+'-section.settings-section').removeClass('hidden')
		}
		else{
			$(this).addClass('collapsed')
			$('#'+wt+'-section.settings-section').addClass('hidden')
		}
	})
	$("#settings_pswd").change(function(e){
		var tv=$(this).val(), tv5=$.md5(tv)
		updateSettings('settings_pswd',tv5)
		updateSettings('settings_pswd_clear',tv)
		$('.bad_value').removeClass('bad_value')
		if(_settings_pswd==g_Settings['settings_pswd']){
			$('#d-settings_pswd').slideUp('slow').siblings().slideDown('slow')
			$('#missing-txt').hide()
		}
		else{
			$(".sp-settings_pswd").addClass('bad_value')
			$("#settings_pswd").focus().select()
		}
	});
	$("#fadeNotices").change(function(e){
		var tid=$(this).attr('id'), tv=$(this).val()
		updateSettings(tid,tv)
	});
	$(".linked").change(function(e){
		var tid=$(this).attr('id'), tv=$(this).val()
		if(tid=='reset_day2'&&(tv==undefined||tv==''||isNaN(tv))){
			alert("Sorry this field cannot be empty and must be a number!")
			$('#'.tid).focus()
			e.stopPropagation()
			return false
		}
		$('.'+tid).html(tv+(tid=='reset_day2'?'<sup>'+((tv%10==1)?'st':((tv%10==2)?'nd':((tv==3)||(tv==23)?'rd':'th')))+'</sup>':''))
		updateSettings(tid,tv)
	});
	$('input[name=bandwidth]').change(function(){
		g_nobwCap=$('#bandwidth-u').is(':checked')
		$('.is-cap')[g_nobwCap?'hide':'show']()
		if(g_nobwCap){
			$('#bw_cap').addClass('disabled');
			updateSettings('bw_cap','')
			$('#spUsageCap').text('Unlimited').removeClass('GBytes')
		}
		else{
			$('#bw_cap').focus()
		}
		setSummaryTotals()
	})
	$('#bw_cap').focus(function(){
		$(this).removeClass('disabled')
		$('#bandwidth-l').prop('checked','checked')
		$('#bandwidth-u').prop('checked','')
		g_nobwCap=$('#bandwidth-u').is(':checked')
	})
	$('#bw_cap').change(function(){
		var band_cap=$(this).val()
		if(!g_nobwCap&&isNaN(band_cap)||band_cap<=0){
			alert('The bandwidth allowance must be a positive number!\n\nPlease try again.')
			$(this).addClass('badvalue').focus()
			return false
		}
		else{
			$('#spUsageCap').text(band_cap).addClass('GBytes')
			updateSettings('bw_cap',band_cap)
		}
		$('.is-cap')[g_nobwCap?'hide':'show']()
		$('.badvalue').change(function(){
			$(this).removeClass('badvalue')
		})
		setSummaryTotals()
	})
	$('#cb-dl-o').change(function(){
		var tid=$(this).attr('id'), tv=$(this).is(':checked')
		updateSettings(tid,tv)
		setSummaryTotals()
	})
   $('#NumDecimals,#DisplayBase,#DisplayUnits').change(function(){
		var tid=$(this).attr('id'), tv=$(this).val()
		updateSettings(tid,tv)
		var du=$("#DisplayUnits").val()
		$("#spBandwidth").html(du=="auto"?"automatically sized.":'in '+dispUnits[du]+'ytes.')
		_dec=$("#NumDecimals").val()||2
		displayBytes('#pageContent')
 	})
	$(".linkedURL").change(function(){
		var tid=$(this).attr('id'), tv=$(this).val()
		$('.'+tid).prop('href',tv)
		updateSettings(tid,tv)
	})
	$(".u-d").click(function(){
		$('#ShowDevices').click()
	})
	$("#ShowDevices").change(function(){
		var tid=$(this).attr('id'), tv=$(this).is(':checked')
		updateSettings(tid,tv)
		showHideDevices()
	})
	$("#ShowRD").change(function(){
		var tid=$(this).attr('id'), tv=$(this).is(':checked')
		updateSettings(tid,tv)
		$('#RouterFooter,#DiffFooter,#PercentFooter,.is-rd')[tv?'show':'hide']()
		var un=$('#mb-filter').val()
		$('.gr-nall')[un=='ALL'&&($('#showISP').is(':checked')||tv)?'show':'hide']()
		DrawHourlyGraph()
		drawGraphs()
	})
	$("#ShowZeroes").change(function(){
		var tid=$(this).attr('id'), tv=$(this).is(':checked')
		updateSettings(tid,tv)
		$('.nad').text(tv?'Hide Zeroes':'Show All')
		showHideDevices()
	})
	$('#ul-redtot').change(function(){
		updateSettings('ul-redtot',$('#ul-redtot').is(':checked'))
		$('.th-tot').html('Totals' +(_unlimited_usage=='0'?'':(' ('+($('#ul-redtot').is(':checked')?'less':'including') + ' Unlimited)')))
		changeTotals('Daily')
		changeTotals('Monthly')
		refreshDevices()
		setSummaryTotals()
 	})
	$('#dataPath2,#usagefile2,#devicefile2,#hourlyfile2,#liveFileName,#hmUpdateRows').change(function(){
		var tid=$(this).attr('id'), tv=$(this).val()
		$('.'+tid).text(tv)
		g_Settings[tid]=tv
		if(tid=='liveFileName'||tid=='hmUpdateRows'){
		}
		else if(tid=='devicefile2'){
			load_devices()
		}
		else{
			setViews()
		}
	})
	$('#useHTTPS,#autoSave').change(function(){
		var isChecked=$(this).is(':checked'),id=$(this).attr('id')
		updateSettings(id,isChecked)
	})
	$('#showLive').change(function(){
		var isChecked=$(this).is(':checked')
		$('.showLive')[isChecked?'removeClass':'addClass']('hidden') 
		updateSettings('showLive',isChecked)
		clearInterval(liveUpdatesTimer)
		$('#enable-lu')[isChecked?'hide':'show']()
		if(isChecked) setUpLiveCharts()
		$('#enable-lu').siblings()[isChecked?'show':'hide']()
		if(isChecked && !$('#live-tab').hasClass('hidden')){
			liveUpdates()
			liveUpdatesTimer=setInterval(liveUpdates,1000*_updatefreq)
		} 
	})
	$('#showISP').change(function(){
		var isChecked=$(this).is(':checked')
		$('.showISP')[isChecked?'removeClass':'addClass']('hidden')
		$('.is-isp')[isChecked?'removeClass':'addClass']('hidden')
		updateSettings('showISP',isChecked)
		var un=$('#mb-filter').val()
		$('.gr-nall')[un=='ALL'&&(isChecked||$('#ShowRD').is(':checked'))?'show':'hide']()
		$('#monthly-breakdown-tab').removeClass('loaded')
		drawGraphs()
	})
	$('#enable-lu')[g_Settings['showLive']?'hide':'show']()
	$('#enable-lu').siblings()[g_Settings['showLive']?'show':'hide']()
	$('input[name=onlyUpdate]').change(function(){
		updateSettings('onlyUpdate',$('input[name=onlyUpdate]:checked').val())
		clearInterval(liveUpdatesTimer)
		if(_doLiveUpdates==1&&$('#showLive').is(':checked') && $('#onlyUpdate-n').is(':checked')){
			liveUpdates()
			liveUpdatesTimer=setInterval(liveUpdates,1000*_updatefreq)
		}
	})
	$('#daily-isp-row .i-isp').change(function(){
		$('#monthly-breakdown-tab').removeClass('loaded')
		$(this).removeClass('badvalue')
		if(isNaN($(this).val())){
			$(this).addClass('badvalue')
			$(this).select()
			return false
		}
		
		var isp_d=$('#d-isp-d').val()*g_toMB,isp_u=$('#d-isp-u').val()*g_toMB,isp_tot=isp_d+isp_u,dt=$('#DailyFooter .TotalBytes').attr('value')
		$('#daily-isp-row .TotalBytes').attr('value',isp_tot)
		$('#daily-isp-row .percent ').text(((isp_tot-dt)/dt*100).toFixed(_dec))
		displayBytes('#daily-isp-row')
		
		var cd=_cr_Date.getDate(),mo=twod(_rs_Date.getMonth()+1),yr=_rs_Date.getFullYear()
		if(!g_Settings['isp']){
			g_Settings['isp']={}
		}
		if(!g_Settings['isp'][mo+'-'+yr]){
			g_Settings['isp'][mo+'-'+yr]={}
		}
		else{
			var isp_totals=JSON.parse(g_Settings['isp'][mo+'-'+yr])
		}

		if((isp_d==''||isp_d==0)&&(isp_u==''||isp_u==0)){
			delete isp_totals[cd]
		}
		else{
			isp_totals[cd]={down:isp_d,up:isp_u}
		}
		g_Settings['isp'][mo+'-'+yr]=JSON.stringify(isp_totals)
		saveSettings()
	})
	$('#correction-row input').change(function(){
		$('.badvalue').removeClass('badvalue')
		if($(this).hasClass('cf-desc')){}
		else if(isNaN($(this).val())){
			$(this).addClass('badvalue')
			alert('This value must be a number!')
			$(this).select()
			return false
		}
		$('#monthly-tab,#monthly-breakdown-tab').removeClass('loaded')
		var desc=$('.cf-desc').val()
		var tdu=$('.cf-u input').val(),tdd=$('.cf-d input').val()
		var cd=_cr_Date.getDate()
		var da=twod(_rs_Date.getDate())
		var mo=twod(_rs_Date.getMonth()+1)
		var yr=_rs_Date.getFullYear()
		var ds=yr+'-'+mo+'-'+da

		if(!g_Settings['corrections']){
			g_Settings['corrections']={}
		}
		if(!g_Settings['corrections'][mo+'-'+yr]){
			g_Settings['corrections'][mo+'-'+yr]={}
			var corrections={}
		}
		else{
			var corrections=JSON.parse(g_Settings['corrections'][mo+'-'+yr])
		}
		var dcvd=(tdd-(corrections[cd]==null?0:corrections[cd].down))*g_toMB
		var dcvu=(tdu-(corrections[cd]==null?0:corrections[cd].up))*g_toMB
		if(desc==''&&(tdu==''||tdu==0)&&(tdd==''||tdd==0)){
			delete corrections[cd]
		}
		else{
			corrections[cd]={desc:desc,down:tdd, up:tdu}
		}
		g_Settings['corrections'][mo+'-'+yr]=JSON.stringify(corrections)
		saveSettings()
		if($(this).hasClass('cf-desc')) return
		tdu=tdu*g_toMB
		tdd=tdd*g_toMB
		$('#correction-row .TotalBytes ').attr('value',tdu+tdd)
		$('#DailyData .is_d').each(function(){
			tdd+=$(this).find('.downloads').attr('value')*1
			tdu+=$(this).find('.uploads').attr('value')*1
		})
		$('#DailyFooter .downloads').attr('value',tdd)
		$('#DailyFooter .uploads').attr('value',tdu)
		$('#DailyFooter .TotalBytes ').attr('value',tdu+tdd)
		var ctb=$('#summary-'+ds+' .TotalBytes ').attr('value')*1
		var ctbd=$('#summary-'+ds+' .downloads ').attr('value')*1
		var ctbu=$('#summary-'+ds+' .uploads ').attr('value')*1
		$('#summary-'+ds+' .TotalBytes ').attr('value', ctb+dcvd+dcvu )
		$('#summary-'+ds+' .downloads ').attr('value', ctbd+dcvd )
		$('#summary-'+ds+' .uploads ').attr('value', ctbu+dcvu )

		displayBytes('#DailyFooter,#correction-row,#summary-'+ds)
		setPercents('#DailyData tr,#correction-row', tdu+tdd)
		if($('#daily-tab').hasClass('loaded'))DrawPie('Daily')
		if($('#monthly-tab').hasClass('loaded'))DrawPie('Monthly')

	})
	$("#mb-filter").change(function(){
		//$('#MonthlyBreakdown').html('')
		$('#MonthlyBreakdown,#breakdownFooter').html('')
		$('#monthly-breakdown-tab').removeClass('loaded').click()
		$('.mb-all')[$('#mb-filter').val()=='ALL'?'addClass':'removeClass']('hidden')
	})
	$('#dateFMT,#dateSep').change(function(){
		updateSettings($(this).attr('id'),$(this).val())
		resetdates()
	}) 
	$('#isp-format').unbind('change').change(function(){
		updateSettings($(this).attr('id'),$(this).val())
		$('#isp-section table').hide()
		$('#isp-'+$(this).val()).show()
	})
	if(typeof(_dbkey)!='undefined'){
		$('#sv-btn').hide().removeClass('visible')
		$('#settings-columns input,#settings-columns radio,#settings-columns select,#settings-columns checkbox,#isp-in,.gr-cb').change(function(){
			$(this).parent('p').addClass('sv-req')
			saveSettings()
		})
	}

	/*Clicks*/
	$('#Refresh').click(function(){
		loadHourly()
		$(".RefreshInterval").html($("#RefreshInterval").val())
	})
	$('#Reset').click(function(){
		$(".RefreshInterval").html($("#RefreshInterval").val())
	})
	$('#StartPause').click(function(){
		if($(this).text()=='Pause'){
			clearInterval(refreshTimer)
			$(this).text('Start')
			$('#Reset,#Refresh').fadeOut('slow')
	   }
		else{
			clearInterval(refreshTimer)
			refreshTimer=setInterval(refreshTimerFunc,1000)
			$(this).text('Pause')
			$('#Reset,#Refresh').fadeIn('slow')
	   }
	});

	$('#luReset').click(function(){
		$('#liveServer').html('')
		liveUpdates()
	})
	$('#luStop').click(function(){
		$(this).fadeOut('slow','',function(){
			$('#luStart').fadeIn('slow')
		})
		clearInterval(liveUpdatesTimer);
	})
	$('#luStart').click(function(){
		$(this).fadeOut('slow','',function(){
			$('#luStop').fadeIn('slow')
		})
		liveUpdates()
		liveUpdatesTimer=setInterval(liveUpdates,1000*_updatefreq);
	})
	$('#h_sd-dd').click(function(){
		$('#h_sd-ddl')[$('#h_sd-ddl').is(':visible')?'slideUp':'slideDown']('slow')
	})
	$('#h_sd-ddl').mouseleave(function(){
		$(this).slideUp('slow')
	})
	$('#h_sd').click(function(){
		$(this).removeClass('partial').toggleClass('checked');
		ShowDevices($(this).hasClass('checked'))
	})
	$(".pDBtn").click(function (){
		_cr_Date=newdate(_cr_Date,-1)
		p_users_updated=''
		if(_cr_Date<_rs_Date){
 			_cr_Date=_rs_Date
			return
		}
		$('.current-date').text(formattedDate(_cr_Date));
		$('#daily-tab').removeClass('loaded');
		loadHourly(true)
	});
	$(".nDBtn").click(function (){
		var today=new Date();
		_cr_Date=newdate(_cr_Date,1)
		p_users_updated=''
		if(_cr_Date>_re_Date){
			_cr_Date=_re_Date
			return
		}
		else if(_cr_Date>today){
			_cr_Date=today
			return
		}
		$('.current-date').text(formattedDate(_cr_Date))
		$('#daily-tab').removeClass('loaded')
		loadHourly(true)
	});
	$("#fDBtn,.fDBtn").click(function (){
		_cr_Date=_rs_Date
		p_users_updated=''
		$('#daily-tab').removeClass('loaded')
		$('.current-date').text(formattedDate(_cr_Date))
		loadHourly(true)
	});
	$("#lDBtn,.lDBtn").click(function (){
		var today=new Date();
		_cr_Date=_re_Date
		p_users_updated=''
		if(_cr_Date>today){
			_cr_Date=today
		}
		$('#daily-tab').removeClass('loaded')
		$('.current-date').text(formattedDate(_cr_Date))
		loadHourly(true)
	});
	$('.go2today').click(function(){
		_cr_Date=new Date()
		$('#daily-tab').removeClass('loaded')
		loadHourly(true)
	})
	$('.current-interval').click(function(){
		$('#monthly-tab').click()
	})
	$('#nmBtn').addClass('nmBtn')
	$('#pmBtn').addClass('pmBtn')
	$('.current-interval').before("<button class='pmBtn' title='Go to the first day of the previous interval' type='button'><<</button>").after("<button class='nmBtn' title='Go to the first day of the next interval' type='button'>>></button>")
	$('.pmBtn').unbind('click').click(function () {
		var prd = $('.currentSummary').attr('id').split('-')
		prd[1] -= (prd[1] == 1 ? - 11 : 1),
		prd[0] -= prd[1] == 12 ? 1 : 0
		var nrd = prd[0] + '-' + twod(prd[1]) + '-' + twod(prd[2])
		if ($('#' + nrd).length == 0) {
			var nr = $('.currentSummary').clone()
			nr.attr('id', nrd)
			nr.find('.interval').text(nrd)
			nr.find('.a-c').html('').removeAttr('value').removeClass('num Kbytes MBytes GBytes')
			$('.currentSummary').after(nr)
		}
		$('.currentSummary').removeClass('currentSummary')
		$('#'+nrd).addClass('currentSummary')
		loadMonthly()
	})
	$('.nmBtn').unbind('click').click(function () {
		if($('.currentSummary').is(':first-child')) return
		var prd = $('.currentSummary').attr('id').split('-')
		prd[1] -= (prd[1]*1 == 12 ? - 11 : -1),
		prd[0] -= prd[1]*1 == 12 ? -1 : 0
		var nrd = prd[0] + '-' + twod(prd[1]) + '-' + twod(prd[2])
		if ($('#' + nrd).length == 0) {
			var nr = $('.currentSummary').clone()
			nr.attr('id', nrd)
			nr.find('.interval').text(nrd)
			$('.currentSummary').before(nr)
		}
		$('.currentSummary').removeClass('currentSummary')
		$('#'+nrd).addClass('currentSummary')
		loadMonthly()
	})

	$('#add-history').click(function(){
		var lr = $('.summary-row').last().attr('id').split('-');
		var mo=(lr[1]==1?12:lr[1]-1),yr=lr[0]-(mo==12?1:0),hid=yr+'-'+twod(mo)+'-'+twod(lr[2])
		var nr=$('.summary-row').last().clone()
		nr.attr('id',hid)
		nr.find('.interval').text(hid)
		$('.currentSummary').removeClass('currentSummary')
		nr.appendTo('#SystemTotalsTable').addClass('currentSummary')
		loadMonthly()
		saveSettings()
	})
	$('#sp_num_devices,#sp_num_active_devices,.nad').click(function(){
		$('#ShowZeroes').click()
	})
	$('.gr-cb').change(function(){
		DrawGraph($(this).attr('id'))
		set_bd_graphs()
	})
	$('#all-graphs').click(function(){
		$('.gr-cb').prop('checked', 'checked')
		drawGraphs()
		set_bd_graphs()
	})
	$('#no-graphs').click(function(){
		$('.gr-cb').prop('checked', false)
		drawGraphs()
		set_bd_graphs()
	})
	$('.ddp').unbind('click').click(function(){
		$(this).siblings().removeClass('sel')
		$(this).addClass('sel')
		updateSettings('is-isp-ddp',$('.is-isp .ddp.sel').attr('id'))
		updateSettings('is-rd-ddp',$('.is-rd .ddp.sel').attr('id'))
		$('#MonthlyBreakdown,#breakdownFooter').html('')
		monthlyBreakdown()
	})
	$('.l-c').hide()
	$('#ed-update').click(function(){
		var nc=$('#ed-colour').val()=='TBD'?'':$('#ed-colour').val()
		if($('#ed-owner').val()==''||$('#ed-name').val()==''){
			alert('The device owner and/or device name fields cannot be empty')
			if ($('#ed-owner').val()=='') $('#ed-owner').addClass('bad_value').focus()
			if($('#ed-name').val()=='') $('#ed-name').addClass('bad_value').focus()
			return
		}
		g_Settings['devices'][$('#ed-mac').text()]={"group":$('#ed-owner').val(),"name":$('#ed-name').val(),"colour":nc}
		$('#ed-clear').show()
		$('#ed-update').text('Update')
		saveSettings()
		$('.loaded').removeClass('loaded')
		$('#DailyData,#MonthlyData,#devicesData').html('')
		$('#edit-device').slideUp('slow')
		$('.l-c').hide()
		setViews()
	})
	$('#ed-clear').click(function(){
		if(!confirm('Are you sure you want to delete these edits?  There is no undo!')) return
		delete g_Settings['devices'][$('#ed-mac').text()]
		$('#ed-clear').hide()
		$('#ed-update').text('Add')
		$('.writing').removeClass('writing')
		saveSettings()
		$('.loaded').removeClass('loaded')
		$('#DailyData,#MonthlyData,#devicesData').html('')
		$('#edit-device').slideUp('slow')
		$('.l-c').hide()
		setViews()
   })
	$('.ed-close').click(function(){
		$('#edit-device').slideUp('slow')
		$('.writing').removeClass('writing')
		$('.writing-row').removeClass('writing-row')
		$('.l-c').hide()
	})
	$('.c-p').click(function(){
		var wc=$(this).attr('id')
		$(this).removeClass('not-sel')
		$(this).siblings().addClass('not-sel')
		$('.l-c').hide()
		$('.c-'+wc).fadeIn('slow')
	})
	$('.l-c').click(function(){
		var r=$(this).css('background-color').replace("rgb(", "").replace(")", "").split(',')
		var hx=Number(0x1000000 + Number(r[0])*0x10000 + Number(r[1])*0x100 + Number(r[2])).toString(16).substring(1)
		$('#ed-colour').val('#'+hx)
	})
	$('.alert-icon').click(function(){
		$(this).addClass('viewed')
		$('#myAlert')[$('#myAlert').is(':visible')?'slideUp':'slideDown']('slow')
	})
	$('#process-isp').click(function(){
		if($('#isp-format').length==0){
			alert('You must upgrade your yamon2.html!')
			return
		}
		var w_isp=$('#isp-format').val()
		if (w_isp==0){
			alert('You must select an ISP format!')
			return
		}
		var in_txt=$('#isp-in').val().split('\n')
		if (in_txt==''){
			alert('This field cannot be empty... paste the contents of your ISP totals table into this field')
			return
		}
		var months=["January","February","March","April","May","June","July","August","September","October","November","December"]
		var out_txt={},mn,yr
		switch (w_isp) {
			case '1':
				$.each(in_txt, function(index, item) {
					var line=item.trim(' ').replace(/,/g,'').replace(/\s+/g,' ').split(' ')
					var dn=line[1]*1
					if(isNaN(dn)) return 
					mn=line[0],yr=line[2]
					out_txt[dn]={down:line[3]*g_toMB,up:line[4]*g_toMB}
				});
				break;
			case '2':
				$.each(in_txt, function(index, item) {
					var line=item.trim(' ').replace(/G/g,'').replace(/-/g,' ').replace(/\s+/g,' ').split(' ')
					var dn=line[2]*1
					if(isNaN(dn)) return 
					mn=months[line[1]-1],yr=line[0]
					out_txt[dn]={down:(line[3]*g_toGB).toFixed(0),up:(line[4]*g_toGB).toFixed(0)}
				}); 
				break;
		}
		var mo=twod(months.indexOf(mn)+1)
		g_Settings['isp'][mo+'-'+yr]=JSON.stringify(out_txt)
		saveSettings()
		$('#isp-out').val(JSON.stringify(out_txt))
	})
}
function setUpLiveCharts(){
	debugtrace("setUpLiveCharts",arguments,3)
	gauges=new google.visualization.Gauge(document.getElementById('gauges'));
	livekbs_do_chart=new google.visualization.LineChart(document.getElementById('livekbs-do-graph'))
	livekbs_up_chart=new google.visualization.LineChart(document.getElementById('livekbs-up-graph'))
	sl_chart=new google.visualization.LineChart(document.getElementById('sl-graph'))
	liveUpdates()
	if ($('#onlyUpdate-n').is(':checked')) liveUpdatesTimer=setInterval(liveUpdates,1000*_updatefreq)
}
function clean(n){
	debugtrace("clean",arguments,2)
	return n.toLowerCase().replace(' ','_').replace(/\W/g, "")
	//return n.toLowerCase().replace(/\W/g, "_")
}
function byGN(a,b) {
	debugtrace("byGN",arguments,3)
	var n1=$(a).attr('g-n')
	var n2=$(b).attr('g-n')
	return ((n1<n2)?-1:((n1>n2)?1:byDevice($(a).attr('mac'),$(b).attr('mac'))));
}
function byName(a,b) {
	debugtrace("byName",arguments,3)
	var n1=devices[a].group.toLowerCase()
	var n2=devices[b].group.toLowerCase()
	return ((n1<n2)?-1:((n1>n2)?1:byDevice(a,b)));
}
function byDevice(a, b) {
	debugtrace("byDevice",arguments,3)
	var d1=devices[a].name.toLowerCase()
	var d2=devices[b].name.toLowerCase()
	return ((d1<d2)?-1:((d1>d2)?1:0));
}
function byDate(a, b) {
	debugtrace("byDate",arguments,3)
	return ((a<b)?1:((a>b)?-1:0));
}
function updateSettings(k,v){
	debugtrace("updateSettings",arguments,2)
	g_Settings[k]=v
}
function saveSettings(sa){
	
	debugtrace("saveSettings",g_Settings,3)
	var ss=JSON.stringify(g_Settings)
	localStorage.setItem('Settings',ss)
	if(typeof(_dbkey)!='undefined'){
		$('#sv-btn').fadeIn('slow').addClass('visible')
		$('#settings-tab').addClass('sv-req')
	}
	if($('#autoSave').is(':checked')){
		saveSettings2db(sa)
	}
}
function saveSettings2db(sa){
	if(typeof(sa)==undefined) sa=true
	debugtrace("saveSettings2db",g_Settings,3)
	var ss=JSON.stringify(g_Settings)
	localStorage.setItem('Settings',ss)
	if(typeof(_dbkey)=='undefined') return
	if(sa) showLoading('Saving Settings to database...')
	var domain='http://usage-monitoring.com'
	if(g_Settings['useHTTPS']) domain='https://usagemonitoringcom.ipage.com'
	var request = $.ajax({
		url: domain+"/db/svSettings.php",
		type: "POST",
		data: { db : _dbkey,settings:ss },
		dataType: "json"
	});
	request.done(function( data ) {
		if (data.response == 'success') {
			$('#sv-btn').fadeOut('slow').removeClass('visible')
			$('.sv-req').removeClass('sv-req')
		}
		else if (data.response == 'error') {
			alert( data.comment );
		}
		clearLoading()
	});
	request.fail(function( jqXHR, textStatus ) {
		alert( "Request failed: " + textStatus );
	});
}
function refreshTimerFunc(){
	debugtrace("refreshTimerFunc",arguments,3)
	$(".RefreshInterval").text($(".RefreshInterval").text()*1-1);
	if ($(".RefreshInterval").text()==0){
		loadHourly();
		$(".RefreshInterval").text($("#RefreshInterval").val());
	}
}
function debugtrace(p,v,l){
	if(l>g_debugLevel) return
	var t=''
	t=v.length==0?'':(" --> "+JSON.stringify(v))
	console.log("tracing: "+p+" ("+l+")")
	console.log("variables: "+t)
}
function changeUnits(wo){
	debugtrace("changeUnits",arguments,1)
	var ct=$(wo).text().toLowerCase()
	var ns=ct=='auto'?ct:2
	$('#DisplayUnits').val(ns).change()
	$('.change-units a').addClass('hidden');
	$('.change-units a')[$('#DisplayUnits').val()=='auto'?'first':'last']().removeClass('hidden')
}
function displayBytes(range,override){
	debugtrace("displayBytes",arguments,2)
	var cells= $(range).find('.num');
	var du=$("#DisplayUnits").val()
	$(cells).removeClass('isNull bytes Kbytes MBytes GBytes TBytes PBytes negative');
	$(cells).each(function(){
		var cell_val='N/A';
		var units='',isneg='',isnull=''
		var bytes=$(this).attr('value')*1;
		if($(this).hasClass('percent')){
			cell_val=$(this).attr('value')
		}
		else if (isNaN(bytes)){
			isnull=' isNull'
			cell_val='-'
		}
		else{
			var unitsIndex=(du=== "auto")?(Math.floor((bytes==0?0:Math.log(Math.abs(bytes)))/Math.log(g_base))):du;
			unitsIndex=override||unitsIndex;
			cell_val=(bytes/Math.pow(g_base,Math.floor(unitsIndex))).toFixed(_dec);
			units=dispUnits[unitsIndex]+'ytes';
			isneg=cell_val<0?' negative':'';
		}
		$(this).html(cell_val).addClass(units+isneg+isnull);
	})
}
function showHideDevices(){
	debugtrace("showHideDevices",arguments,1)
	var sz=$('#ShowZeroes').is(':checked')
	var sd=$('#ShowDevices').is(':checked')
	$('.is_d').each(function(){
		var bytes=$(this).find('.TotalBytes').attr('value');
		var is_z=(bytes==0)||(bytes=='-');
		var is_v=!$(this).hasClass('hidden')
		if(!sd){
			$(this).addClass('hidden')
		}
		else if (is_z&&sz&&!is_v) {
			$(this).removeClass('hidden')
		}
		else if(is_z&&!sz&&is_v){
			$(this).addClass('hidden').addClass('is_z')
		}
		else if(!is_z&&!is_v){
			$(this).removeClass('hidden')
		}
	})
	$('.is_dd,.is_u').each(function(){
		var bytes=$(this).find('.TotalBytes').attr('value');
		var is_z=(bytes==0)||(bytes=='-');
		var is_v=!$(this).hasClass('hidden')
		if (is_z&&sz&&!is_v) {
			$(this).removeClass('hidden')
		}
		else if(is_z&&!sz&&is_v){
			$(this).addClass('hidden')
		}
		else if(!is_z&&!is_v){
			$(this).removeClass('hidden')
		}
	})
	$('.u-d').removeClass('c-u c-d').addClass(sd?'c-d':'c-u')
	$('.item-e')[sd?'removeClass':'addClass']('item-c');
	$('.is-cap')[g_nobwCap?'hide':'show']()
	$('#correction-row')[$('.cf-desc').val()==''&&$('#correction-row .TotalBytes').attr('value')==0?'hide':'show']()
	$('#Monthly-correction-row')[$('#Monthly-correction-row .TotalBytes').hasClass('isNull')?'hide':'show']()
	
	$('#daily-tab-section').is(':visible') && DrawPie('Daily')
	$('#daily-tab-section').is(':visible') && DrawHourlyGraph()
	$('#monthly-tab-section').is(':visible') && DrawPie('Monthly')
	$('#monthly-tab-section').is(':visible') && _unlimited_usage=='1' && DrawPie('Unlimited')
	$('#devicesData tr:visible').css('background-color','#FFF')
	$('#devicesData tr:visible:odd').css('background-color','#EEE')
}
function lastmod(du,da){
	//adapted from pretty.js
	debugtrace("lastmod",arguments,2)
	if(!du) return 'Unknown???'
	if(du==da) return '-'
	var dd=du.split(' '),ymd=dd[0].split('-'),hms=dd[1].split(':'),du2=(new Date(ymd[0],ymd[1]-1,ymd[2],hms[0],hms[1],hms[2]))
	var dis=Math.floor(((new Date()).valueOf()-du2.valueOf())/1000)
	return sec2text(dis,'h')+ " ago";
}
function sec2text(dis,fmt){
	var d=Math.floor(dis/86400)+'d ',h=(Math.floor(((dis/86400)%1)*24))+'h ',m=(Math.floor(((dis/3600)%1)*60))+'m ',s=(Math.round(((dis/60)%1)*60))+'s'
	if(d=='0d ')d=''
	if(d==''&&h=='0h '||fmt=='d')h=''
	if(d+h==''&&m=='0m '||(fmt=='h'&&d+h!=''))m=''
	if(d+h==''&&s=='0s '||(fmt=='h'&&d+h!=''))s=''
	return(d+h+m+s)
}
function flushChanges(){
	debugtrace("flushChanges",arguments,3)
	$('.num').attr('title','').removeClass('changed c0 c1 c2 c3 c4 c5');
}
function setPercents(rows, tot){
	debugtrace("setPercents",arguments,2)
	var ctot=0
	$(rows).each(function(){
		var dt=$(this).find('.TotalBytes').attr('value');
		var dp=(isNaN(dt)?0:dt*1)/tot*100
		ctot+=($(this).hasClass('is_d')||$(this).hasClass('is_dd')||$(this).attr('id')=='correction-row'||$(this).attr('id')=='Monthly-correction-row'?dp:0)
		dp=(dp > 0.1)? dp.toFixed(_dec):"-";
		var pcu=(dp>100&&"over-cap"||dp>90&&"cap-90"||dp>80&&"cap-80"||dp>40&&"cap-40"||'cap-ok')
		$(this).find('.percent').text(dp).removeClass('over-cap cap-90 cap-80 cap-40 cap-ok').addClass(pcu)
	})
	$(rows).parents('table').find('.ftotals .percent').text(ctot.toFixed(_dec))
}
function zeroDevicesTotal(){
	debugtrace("zeroDevicesTotal",arguments,2)
	Object.keys(names).forEach(function(k){
		names[k].up=0
		names[k].down=0
		names[k].ul_up=0
		names[k].ul_down=0
	})
}
function updateRow(did,arr){
	debugtrace("updateRow",arguments,2)
	arr.forEach(function(i){
		updateValue('#'+did+i[0],i[1])
	})
}
function updateValue(vid,v){
	debugtrace("updateValue",arguments,2)
	var delta=v-($(vid).attr('value')||0)
	if(delta==0) return
	if($(vid).hasClass('percent')){
		$(vid).text(v)
		$(vid)[v<0?'addClass':'removeClass']('negative')
		return
	}
	var deltaIndex=Math.floor(Math.log(Math.abs(delta))/Math.log(g_base));
	var delta_val=(delta/Math.pow(g_base,Math.floor(deltaIndex))).toFixed(_dec);
	var units=dispUnits[deltaIndex]+'ytes';
	var nstars=Math.floor(Math.log(delta)/Math.log(g_base));
	var msg='delta: '+delta_val + ' ' + units
	$(vid).attr('value',v).attr('title',msg)
	if($(vid).parents('tr').hasClass('is_d'))$(vid).addClass('changed c'+nstars)
}
function ShowDevices(sh){
	debugtrace("ShowDevices",arguments,2)
	$('#DailyData .legend-colour').each(function(){
		$(this)[sh==1?'removeClass':'addClass']('op10')
		$(this).next()[sh==1?'removeClass':'addClass']('so')
	})
	$('#daily-tab-section').is(':visible') && DrawHourlyGraph()
}
function ShowUserDevices(un){
	debugtrace("ShowUserDevices",arguments,2)
	$('#DailyData .legend-colour').each(function(){
		var ishidden=($(this).parents('tr').attr('group')==un)
		$(this)[ishidden?'removeClass':'addClass']('op10')
		$(this).next()[ishidden?'removeClass':'addClass']('so')
	})
	$('#daily-tab-section').is(':visible') && DrawHourlyGraph()
}
function DrawHourlyGraph(){
	debugtrace("DrawHourlyGraph",arguments,1)
	if($('#DailyData .legend-colour:visible').not('.op10').length==0){
		$('#hourlyGraph').html("<h2>Hourly Graph: No devices are selected in the table above</h2>")
		$('#hourlyDiffGraph').html("<h2>Hourly Differences Graph: No devices are selected in the table above</h2>")
		$('#bnav').hide()
		set_h_sd()
		return
	}
	$('#bnav').fadeIn()
	var inKbytes=true
	var hdata=new google.visualization.DataTable()
	var colours=[],gseries=[]
	hdata.addColumn('string','Name');
	$('#DailyData .legend-colour:visible').not('.op10').each(function(){
		var mac=$(this).parents('tr').attr('mac')
		hdata.addColumn('number', devices[mac].group+'-'+devices[mac].name)
		var tcolour=devices[mac].colour==''?colours_list[devices[mac].n]:devices[mac].colour
		colours.push(tcolour)
		var thisbytes=$(this).parents('tr').find('.TotalBytes').hasClass('Kbytes')||$(this).parents('tr').find('.TotalBytes').hasClass('bytes')
		inKbytes=inKbytes&&thisbytes
		gseries.push({color:tcolour,type:'column',visibleInLegend:true,targetAxisIndex:0})
	})
	set_h_sd()
	
	var show_pnd=$('#ShowRD').is(':checked')&&$('#h_sd').hasClass('checked')
	if(show_pnd){
		var diffdata=new google.visualization.DataTable(),dseries=[]
		hdata.addColumn('number','Measured @ Router')
		gseries.push({lineWidth:1,color:'black',type:'line',visibleInLegend:true,targetAxisIndex:0})
		$('#hourlyDiffGraph').show()
		diffdata.addColumn('string', 'Name')
		diffdata.addColumn('number', 'Download Differences')
		diffdata.addColumn('number', 'Upload Differences')
		diffdata.addColumn('number', 'Cummulative Download %')
		diffdata.addColumn('number', 'Cummulative Upload %')
		diffdata.addColumn('number', 'Combined Differences')
		dseries.push({lineWidth:1,color:'#659ec7',type:'line',lineDashStyle:[2,1],visibleInLegend:true,targetAxisIndex:0})
		dseries.push({lineWidth:1,color:'#2554c7',type:'line',visibleInLegend:true,targetAxisIndex:0})
		dseries.push({lineWidth:1,color:'#800000',type:'line',lineDashStyle: [2, 1],visibleInLegend:true,targetAxisIndex:1})
		dseries.push({lineWidth:1,color:'#c11b17',type:'line',visibleInLegend:true,targetAxisIndex:1})
		dseries.push({lineWidth:1,color:'black',type:'line',visibleInLegend:true,targetAxisIndex:1})
	}
	else{
		$('#hourlyDiffGraph').hide()	
	}
	
	var rd=null,c_pnd_d=0,c_pnd_u=0,c_int_d=0,c_int_u=0
	for(var x=0;x<24;x++){
		var pnd_d=0,pnd_u=0
		if(!show_pnd||!pnd_data||!pnd_data.usage||!pnd_data.usage[x]){
			rd=null
		}
		else{
			pnd_d=pnd_data.usage[x].down
			pnd_u=pnd_data.usage[x].up
			rd=pnd_data.usage[x].down+pnd_data.usage[x].up
		}
		c_pnd_d+=pnd_d
		c_pnd_u+=pnd_u
		var hr=twod(x),vv=[hr],diff_row=[],int_d=0,int_u=0
		diff_row.push(hr)
		$('#DailyData .legend-colour:visible').not('.op10').each(function(){
			var mac=$(this).parents('tr').attr('mac')
			vv.push(1*((hourly[mac].usage[x].down*1+hourly[mac].usage[x].up*1)/(inKbytes?g_toKB:g_toMB)).toFixed(_dec))
			int_d+=hourly[mac].usage[x].down*1
			int_u+=hourly[mac].usage[x].up*1
		})
		c_int_d+=int_d
		c_int_u+=int_u
		if(show_pnd){
			vv.push(1*((rd*1)/(inKbytes?g_toKB:g_toMB)).toFixed(_dec))
			diff_row.push(int_d==0?null:1*((pnd_d-int_d)/g_toMB).toFixed(_dec))
			diff_row.push(int_u==0?null:1*((pnd_u-int_u)/g_toMB).toFixed(_dec))
			diff_row.push(int_d==0?null:1*((c_pnd_d-c_int_d)/c_int_d*100).toFixed(_dec))
			diff_row.push(int_u==0?null:1*((c_pnd_u-c_int_u)/c_int_u*100).toFixed(_dec))
			diff_row.push(int_d==0?null:1*((c_pnd_d+c_pnd_u-c_int_d-c_int_u)/(c_int_d+c_int_u)*100).toFixed(_dec))
			diffdata.addRow(diff_row)
		}
		hdata.addRow(vv);
	}
	var baroptions={width:900,height:400,title:'Hourly Totals',legend:{position:'right',textStyle:{fontSize:11}},chartArea:{},isStacked:true,is3D:true,hAxis:{title:'Hour of the Day - '+$('#current-date').text(),slantedText:false,titleTextStyle:{color:'green'},textStyle:{fontSize:11}},vAxis:{title:'Total Usage in '+(inKbytes?'kB':'MB'),titleTextStyle:{color:'green'}},series:{}}
	baroptions.colors=colours
	var hourlychart=new google.visualization.ColumnChart(document.getElementById('hourlyGraph'))
	baroptions['series']=gseries
	hourlychart.draw(hdata,baroptions)
	if (show_pnd){
		var hourlydiffchart=new google.visualization.ColumnChart(document.getElementById('hourlyDiffGraph'))
		var diffoptions={width:900,height:400,title:'Hourly Differences between Measured @ Router & YAMon',series:{},legend:{position:'bottom',textStyle:{fontSize:8}},hAxis:{title:'Hour of the Day - '+$('#current-date').text(),slantedText:false,titleTextStyle:{color:'green'},textStyle:{fontSize:11}},vAxes:{0:{title:'Differences (in MB)',titleTextStyle:{color:'blue'}},1:{title:'Cummulative Differences (in %)',titleTextStyle:{color:'#800000'}}}}
		diffoptions['series']=dseries

		hourlydiffchart.draw(diffdata,diffoptions)
	}
}
function DrawMonthlybyDeviceGraph(){
	debugtrace("DrawMonthlybyDeviceGraph",arguments,1)
	var ddata=new google.visualization.DataTable()
	var colours=[],ocolours=[],gseries=[],oseries=[]
	ddata.addColumn('string','Name');
	$('#MonthlyData .is_d').each(function(){
		var mac=$(this).attr('mac')
		ddata.addColumn('number', devices[mac].group+'-'+devices[mac].name)
		var tcolour=devices[mac].colour==''?colours_list[devices[mac].n]:devices[mac].colour
		colours.push(tcolour)
		gseries.push({color:tcolour,type:'column',visibleInLegend:true,targetAxisIndex:0})
	})
	var odata=new google.visualization.DataTable()
	odata.addColumn('string','Name');
	var lnl=[]
	$($('#MonthlyData .is_u').get().reverse()).each(function(){
		var owner=$(this).attr('g-n'),pct=$(this).find('.percent').text()
		if(pct=='-') return
		lnl[owner]=0
		odata.addColumn('number', names[owner].group+' - '+(pct=='-'?0:pct)+'%' )
		var tcolour=colours_list[names[owner].n+64]
		ocolours.push(tcolour)
	})
	var dism=new Date(_rs_Date.getFullYear(),_rs_Date.getMonth()*1+1,0).getDate()
	for(var x=_resetDay;x<=dism;x++){
		var vv=[twod(x)],od=[twod(x)]
		$('#MonthlyData .is_d').each(function(){
			var mac=$(this).attr('mac'),owner=$(this).attr('g-n').split('-')[0]
			var trfc=1*((monthly[mac].usage[x].down*1+monthly[mac].usage[x].up*1)/g_toMB).toFixed(_dec)
			lnl[owner]+=trfc
			vv.push(trfc)
		})
 		ddata.addRow(vv);
		$($('#MonthlyData .is_u').get().reverse()).each(function(){
			var owner=$(this).attr('g-n'),pct=$(this).find('.percent').text()
			if(pct=='-') return
			od.push(1*(lnl[owner]/1024).toFixed(_dec))
		})
		odata.addRow(od)
	}
	for(var x=1;x<_resetDay;x++){
		var vv=[twod(x)],od=[twod(x)]
		$('#MonthlyData .is_d').each(function(){
			var mac=$(this).attr('mac'),owner=$(this).attr('g-n').split('-')[0]
			var trfc=1*((monthly[mac].usage[x].down*1+monthly[mac].usage[x].up*1)/g_toMB).toFixed(_dec)
			lnl[owner]+=trfc
			vv.push(trfc)
		})
 		ddata.addRow(vv);
		$($('#MonthlyData .is_u').get().reverse()).each(function(){
			var owner=$(this).attr('g-n'),pct=$(this).find('.percent').text()
			if(pct=='-') return
			od.push(1*(lnl[owner]/1024).toFixed(_dec))
		})
		odata.addRow(od)
	}
	if($('#MonthlyGraphbyDevice').length==0){
		$('#monthly-tab-section .main-section').after("<div id='MonthlyGraphbyDevice'/>")
	}
	var devicechart=new google.visualization.ColumnChart(document.getElementById('MonthlyGraphbyDevice'))
	var d_options={width:900,height:400,title:'Daily Totals by Device',legend:{position:'right',textStyle:{fontSize:8}},chartArea:{},isStacked:true,is3D:true,hAxis:{title:$(".current-interval").first().text(),slantedText:true,titleTextStyle:{color:'green'},textStyle:{fontSize:7}},vAxis:{title:'Total Usage in MB',titleTextStyle:{color:'green'}},series:{}}
	d_options.colors=colours
	d_options['series']=gseries
	devicechart.draw(ddata,d_options)

	if($('#MonthlyGraphbyOwner').length==0){
		$('#MonthlyGraphbyDevice').after("<div id='MonthlyGraphbyOwner'/>")
	}
	var ownerchart=new google.visualization.AreaChart(document.getElementById('MonthlyGraphbyOwner'))
	var o_options={width:900,height:400,title:'Cummulative Monthly Totals by Owner',legend:{position:'right',textStyle:{fontSize:11}},chartArea:{},isStacked:true,is3D:true,hAxis:{title:$(".current-interval").first().text(),slantedText:true,titleTextStyle:{color:'green'},textStyle:{fontSize:7}},vAxis:{title:'Total Usage in GB',titleTextStyle:{color:'green'}},series:{}}
	o_options.colors=ocolours
	ownerchart.draw(odata,o_options)
}
function set_h_sd(){
	debugtrace("set_h_sd",arguments,3)
	var c_hd=$('.op10').length,n_tot=$('#DailyData .is_d').not('.is_z').length,n_vis=$('#DailyData .is_d:visible').length
	if(n_tot==n_vis&&c_hd==0){
		$('#h_sd').removeClass('partial').addClass('checked');
		$('.h_fd').removeClass('fd-sel fd-some')
		$('#h_fd-all').addClass('fd-sel')
		$('#h_sd-dd').text('All')
	}
	else if(c_hd==$('#DailyData .legend-colour').length||n_vis==0){
		$('#h_sd').removeClass('partial checked');
		$('.h_fd').removeClass('fd-sel fd-some')
		$('#h_fd-none').addClass('fd-sel')
		$('#h_sd-dd').text('None')
	}
	else{
		$('#h_sd').removeClass('checked').addClass('partial');
		$('.h_fd').each(function(){
			var un=$(this).text()
			var ni = $(".is_d[group='"+un+"']").length, nd=$(".is_d[group='"+un+"'] .op10").length
			if(ni==0) return;
			if(nd==0){
				$(this).removeClass('fd-some').addClass('fd-sel')
			}
			else if(nd==ni){
				$(this).removeClass('fd-sel fd-some')
			}
			else{
				$(this).removeClass('fd-sel').addClass('fd-some')
			}
		})
		$('#h_sd-dd').text('Selected')

 	}
}
function DrawPie(m_d){
	debugtrace("DrawPie",arguments,1)
	var rn=0;
	var ch_title=(m_d=='Unlimited')
		?('Usage by User and/or Device during\n`Unlimited` interval (i.e., between '+_unlimited_start+' - '+_unlimited_end+')')
		:(_unlimited_usage=='1'
			?(m_d+' Usage by User and/or Device\n(' + ($('#ul-redtot').is(':checked')?'less':'including') + ' `Unlimited` usage between '+_unlimited_start+' - '+_unlimited_end+')')
			:('Usage by User and/or Device')
		)
	var options={title: ch_title,is3D:true,slices:{},colors:{},chartArea:{left:16,height:240,width:386}, legend:{alignment:'center', position: 'right', textStyle: {color: 'black', fontSize: 10}}}
	var data, datarows=[],devicecolours=[],tmp, mac
	var showexploded=false
	var colours=[]
	var wt=(m_d=='Unlimited')?'Monthly':m_d
	data=new google.visualization.DataTable();
	data.addColumn('string','User/Device');
	data.addColumn('number','MB Used');
	$('#'+wt+'Data tr').not('.hidden').each(function(){
		if($(this).hasClass('is_u')&&$(this).find('.item-e.item-c').length==0){
			return;
		}
		if($(this).hasClass('is_u')){
			showexploded=true
			var pn=$(this).find('.userName').text(),n=$(this).attr('g-n'),tc=colours_list[names[n].n+64]
			colours.push(tc)
			$('#gp-'+n).find('.item-e').css('backgroundColor',tc)
			$('#mgp-'+n).find('.item-e').css('backgroundColor',tc)
		}
		else if($(this).hasClass('is_d')){
			if ($(this).find("span").hasClass("op10")) return true
			var pn=$(this).attr('group')+'-'+$(this).find('.thedevice').text()
			options.slices[rn]={offset:0.14}
			var tmp=$(this).find('.deviceName').attr('title').split('|');
			var mac=tmp[0].trim().toUpperCase();
			var tcolour=devices[mac].colour==''?colours_list[devices[mac].n]:devices[mac].colour
			colours.push(tcolour)
		}
		var ca=(((m_d=='Unlimited')?$(this).find('.ul-down').attr('value')*1+$(this).find('.ul-up').attr('value')*1:$(this).find('.TotalBytes').attr('value'))/g_toMB).toFixed(_dec)
		datarows.push([pn,Math.max(ca*1,0)])
		rn++
	})

	if((m_d=='Daily') && ($('#correction-row .TotalBytes ').attr('value')!=0)){
		var ca=($('#correction-row .TotalBytes ').attr('value')/g_toMB).toFixed(_dec)
		datarows.push(['Corrections',Math.max(ca*1,0)])
		colours.push('black')
	}
	else if((m_d=='Monthly') && ($('#Monthly-correction-row .TotalBytes ').attr('value')!=0)){
		var ca=($('#Monthly-correction-row .TotalBytes ').attr('value')/g_toMB).toFixed(_dec)
		datarows.push(['Corrections',Math.max(ca*1,0)])
		colours.push('black')
	}
	data.addRows(datarows);
	$('#'+m_d+'Graph').hasClass('hidden') && $('#'+m_d+'Graph').show()
	var ChartObj=new google.visualization.PieChart(document.getElementById(m_d+'Graph'));
	if(!showexploded){
		Object.keys(options.slices).forEach(function(k){
			options.slices[k].offset=0;
		})
	}
	options.colors=colours
	ChartObj.draw(data,options);
}
function changelegend(){
	debugtrace("changelegend",arguments,3)
	$('#changes-legend')[$('table .changed').length==0?'slideUp':'slideDown']('slow')
	$('#changes-legend .c0')[$('table .changed.c0').length==0?'hide':'show']()
	$('#changes-legend .c1')[$('table .changed.c1').length==0?'hide':'show']()
	$('#changes-legend .c2')[$('table .changed.c2').length==0?'hide':'show']()
	$('#changes-legend .c3')[$('table .changed.c3').length==0?'hide':'show']()
	$('#changes-legend .c4')[$('table .changed.c4').length==0?'hide':'show']()
	$('#changes-legend .c5')[$('table .changed.c5').length==0?'hide':'show']()
}
function changeTotals(wt){
	debugtrace("changeTotals",arguments,3)
	var ul_redtot=$('#ul-redtot').is(':checked')?1:0,
	total=0

	$('#'+wt+'Data tr').each(function(){
		var rid=$(this).attr('id')
		var down=$(this).find('.downloads').attr('value')*1,
		up=$(this).find('.uploads').attr('value')*1,
		ul_down=$(this).find('.ul-down').attr('value')*1,
		ul_up=$(this).find('.ul-up').attr('value')*1,
		ut=up+down-(ul_up+ul_down)*ul_redtot
		total+=ut*$(this).hasClass('is_d')
		updateRow(rid,[[' .TotalBytes',ut]])	   
	})
	updateRow(wt+'Footer',[[' .TotalBytes',total]])	   

	setPercents('#'+wt+'Data tr, #'+wt+'-correction-row', total)
	displayBytes('#'+wt+'-usage-table');
	DrawPie(wt)
}
function ShowAlert(msg,tcl){
	debugtrace("ShowAlert",arguments,3)
	$('.alert-icon').fadeIn('slow')
	if($('#myAlert').length==0){
		$('#data-section').after("<div id='myAlert' class='hidden'><p>Alert<img id='alert-close' title='Click to close this dialog' src='http://usage-monitoring.com/current/images/close.png'><img id='alert-clear' title='Click to clear this list of errors' src='http://usage-monitoring.com/current/images/clear.png'></p><div id='myAlert-body'></div></div>")
		$('#alert-close').click(function(){
			$('#myAlert').slideUp('slow')
			$('.not-viewed').removeClass('not-viewed')
		})
		$('#alert-clear').click(function(){
			$('#myAlert-body').html('')
			$('#myAlert').slideUp('slow')
		})
		$("#myAlert").draggable({ cursor: "move",cancel:"#myAlert-body"});
	}
	else if($('#myAlert .'+tcl).html()==msg){
		return
	}
	if(typeof(tcl)!='undefined') $('.'+tcl).remove()
	$('#myAlert-body').append("<p class='"+tcl+" not-viewed'>"+msg+"</p>")
	var height = $('#myAlert-body').get(0).scrollHeight
}
function addcorrection(){
	debugtrace("addcorrection",arguments,3)
	$('#correction-row,#remove-correction').slideDown('slow')
	$('#no-daily-data,#add-correction').slideUp('slow')
}
function removecorrection(){
	debugtrace("removecorrection",arguments,3)
	if(confirm('Are you sure you want to delete the correction for this date?')){
		$('#correction-row input').val('').change()
		$('#correction-row,#remove-correction').slideUp('slow')
		$('#add-correction').slideDown('slow')
		$('#no-daily-data')[$('#DailyData tr').length==0?'slideDown':'slideUp']('slow')
		$('#DailyFooter')[$('#DailyData tr').length==0?'slideUp':'slideDown']('slow')
	}
}
function newdate(d,o){
	debugtrace("newdate",arguments,3)
	return new Date(d.getFullYear(),d.getMonth(),d.getDate()+o);
}

function deleteSummaryEntry(i) {
	debugtrace("deleteSummaryEntry",arguments,3)
	if(confirm('Are you sure you want to delete this history entry?\nThis will also reload the data.')){
		$('#'+i).remove()
		delete g_Settings['summaries'][i]
		saveSettings()
	}
}

function stuckLoading(){
	debugtrace("stuckLoading",arguments,3)

	if(stillLoadingDevices){
		$('.loading-wrapper').fadeOut(1500);
		alert("The loading message appears to be `stuck` on the screen... This typically means that there has been a JavaScript error.  Please type `Crtl`+`Shift`+`J` to open the JavaScript console window (or `F12` if you're using MSIE) and send the error information to Al.")
		stillLoadingDevices=false
	}
	clearTimeout(loadingTimer);
}
function clearLoading(){
	debugtrace("clearLoading",arguments,3)
	$('.loading-wrapper').delay(1000).fadeOut(1500);
	clearTimeout(loadingTimer);
}
function showLoading(msg){
	debugtrace("showLoading",arguments,3)
	$('.loading').text(msg)
	$('.loading-wrapper').fadeIn(500);
	loadingTimer=setTimeout(function(){stuckLoading()},9999);
}

function settings(wo){
	debugtrace("settings",arguments,3)
	if(wo=='reset'){
		if(!confirm('Are you sure that you want to clear all localStorage variables stored for YAMon?')){
			return
		}
		localStorage.removeItem('Settings')
		return
	}
	
	if($('#settings').length==0) $('#settings-tabs').append($('<div/>').attr('id', 'settings').draggable({ cursor: "move",cancel:"#settings textarea"}))
	
	if(wo=='export'){
		$('#settings').html("<h3>Export Settings</h3><p>All of the settings, etc. for this web app are retained in localStorage (meaning that they are private to this browser on this computer).  This is my quick & dirty method (emphasis on the latter) for copying your settings to different browser or device.</p><p>Copy the text from the field below to a file on a USB stick or email it to yourself and then open the `Settings` tab on the other machine (or browser) and click `Import`.</p><textarea rows=16 cols=80></textarea><p><button onclick=close_settings()>Close</button></p>").slideDown('slow')
		var ts=JSON.stringify(localStorage)
		$('#settings textarea').val(ts)
	}
	else if(wo=='devices'){
		$('#settings').html("<h3>Export Devices</h3><p>This is my quick & dirty method (emphasis on the latter) to export all of your customized device information to `users.js`  </p><p>Copy the text from the field below and paste it into your `users.js` file on your router</p><textarea rows=16 cols=80></textarea><p><button onclick=close_settings()>Close</button></p>").slideDown('slow')
		var str='var users_created="'+users_created+'"\n\n'
		Object.keys(devices).sort(byName).forEach(function(d){
			var di=d.split('-'),mac=di[0],key=''
			if(!di[1]){}
			else{
				key=',"key":'+di[1]
			}
			str+='ud_a({"mac":"'+mac+'","ip":"'+devices[d].ip+'","owner":"'+devices[d].group+'","name":"'+devices[d].name+'"'+key+',"colour":"'+devices[d].colour+'","added":"'+devices[d].added+'","updated":"'+devices[d].updated+'"})\n'
		})		
 
		$('#settings textarea').val(str).select()
	}
	else{
		$('#settings').html("<h3>Import Settings</h3><p>Paste the settings you exported previously into the field below and then click `Import`.</p><p><b>NOTE</b> - this replace all similarly named variables within the localStorage for this browser on this machine.  <i>It cannot be undone!</i>  I strongly recommend that you first export the settings from this machine... just in case!</p><textarea rows=16 cols=80></textarea><p><button onclick=import_settings()>Import</button><button onclick=close_settings()>Cancel</button></p>").slideDown('slow')
	}
}
function close_settings(){
	debugtrace("close_settings",arguments,3)
	$('#settings').slideUp('slow')
}
function import_settings(){
	debugtrace("import_settings",arguments,3)
	if(!confirm("Are you sure you want to do this?  Have you already backed up the settings from this machine (by exporting them)?\n\nRemember that you cannot undo this operation without a backup... you've been warned!  Click `Cancel` to chicken out.")){
		close_settings()
		return false
	}
	if ($('#settings textarea').val()==''){
		ShowAlert('There is nothing to import?!?','import')
		return
	}
	var nv=JSON.parse($('#settings textarea').val())
	Object.keys(nv).forEach(function(k){
		localStorage.setItem(k,nv[k])
	})
	location.reload();
}
function drawGraphs(){
	debugtrace("drawGraphs",arguments,3)
	if(!$('#monthly-breakdown-tab-section').is(':visible')) return
	var mbfs=$('#mb-filter :selected'),un=$(mbfs).val(),dn=$(mbfs).text()
	if(un=='ALL'){
		var gr4='All Devices for All Users'
	}
	else if($(mbfs).hasClass('ddl-u')){
		var gr4='All Devices for User: `'+dn+'`'
	}
	else{
		var gp=$(mbfs).attr('gp')
		var gr4='Device: `'+dn+'` for User: `'+gp+'`'
	}
	$('#graphsfor').text(gr4)
	$('.gr-nall')[un=='ALL'&&($('#showISP').is(':checked')||$('#ShowRD').is(':checked'))?'show':'hide']()
   
	var bd_graphs=g_Settings['graphs']
	Object.keys(bd_graphs).forEach(function(k){
		DrawGraph(k)
	})
}

function DrawGraph(wg){

	function SetDiffCols(s){
		if(inc_rd){
			graph_data.addColumn('number','Router Down');
			graph_data.addColumn('number','Router Up');
			graph_data.addColumn('number','Router Total');
			s.push({lineWidth:1,color:'#659ec7',lineDashStyle:[2,1],type:'line',visibleInLegend:true,targetAxisIndex:0})
			s.push({lineWidth:1,color:'#800000',lineDashStyle:[2,1],type:'line',visibleInLegend:true,targetAxisIndex:0})
			s.push({lineWidth:1,color:'green',type:'line',visibleInLegend:true,targetAxisIndex:0})
		}
		if(inc_isp){
			graph_data.addColumn('number',ispname+' Down');
			graph_data.addColumn('number',ispname+' Up');
			graph_data.addColumn('number',ispname+' Total');
			s.push({lineWidth:1,color:'#2554c7',lineDashStyle:[2,1],type:'line',visibleInLegend:true,targetAxisIndex:0})
			s.push({lineWidth:1,color:'#c11b17',lineDashStyle:[2,1],type:'line',visibleInLegend:true,targetAxisIndex:0})
			s.push({lineWidth:1,color:'red',type:'line',visibleInLegend:true,targetAxisIndex:0})
		}
	}
	function SetCols(s){
		if(inc_rd){
			graph_data.addColumn('number','Router');
			s.push({lineWidth:1,color:'green',type:'line',visibleInLegend:true,targetAxisIndex:0})
		}
		if(inc_isp){
			graph_data.addColumn('number',ispname);
			s.push({lineWidth:1,color:'red',type:'line',visibleInLegend:true,targetAxisIndex:0})
		}
	}

	function GetDownloadGraphData(){
		debugtrace("GetDownloadGraphData",arguments,3)
		var gr_scale=setGraphScale('downloads'), series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Downloads (in '+gr_scale+')'
		graph_data.addColumn('number','YAMon - Downloads');
		series.push({color:yd_colour,type:'column',visibleInLegend:true,targetAxisIndex:0})
		SetCols(series)
		var rdv=0,ispv=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			row_data.push(((!dataset[dn]?0:dataset[dn].down)/sc).toFixed(_dec)*1)
			if(inc_rd){
				rdv=!monthly_totals.pnd[dn]?null:((monthly_totals.pnd[dn].down/sc).toFixed(_dec)*1)
				row_data.push(rdv==0?null:rdv)
			}
			if(inc_isp){
				ispv=!isp_totals[dn]?null:((isp_totals[dn].down/sc).toFixed(_dec)*1)
				row_data.push(ispv)
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	
	function GetUploadGraphData(){
		debugtrace("GetUploadGraphData",arguments,3)
		var gr_scale=setGraphScale('uploads'), series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Uploads (in '+gr_scale+')'
		graph_data.addColumn('number','YAMon - Uploads');
		series.push({color:yu_colour,type:'column',visibleInLegend:true,targetAxisIndex:0})
		SetCols(series)
		var rdv=0,ispv=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			row_data.push(((!dataset[dn]?0:dataset[dn].up)/sc).toFixed(_dec)*1)
			if(inc_rd){
				rdv=!monthly_totals.pnd[dn]?null:((monthly_totals.pnd[dn].up/sc).toFixed(_dec)*1)
				row_data.push(rdv==0?null:rdv)
			}
			if(inc_isp){
				ispv=!isp_totals[dn]?null:((isp_totals[dn].up/sc).toFixed(_dec)*1)
				row_data.push(ispv)
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	
	
	function GetTotalGraphData(){
		debugtrace("GetTotalGraphData",arguments,3)
		var gr_scale=setGraphScale('TotalBytes'), series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Total Usage (in '+gr_scale+')'
		graph_data.addColumn('number','YAMon - Downloads');
		graph_data.addColumn('number','YAMon - Uploads');
		series.push({color:yd_colour,type:'column',visibleInLegend:true,targetAxisIndex:0})
		series.push({color:yu_colour,type:'column',visibleInLegend:true,targetAxisIndex:0})
		SetCols(series)
		var rdv=0,ispv=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			row_data.push(((!dataset[dn]?0:dataset[dn].down)/sc).toFixed(_dec)*1)
			row_data.push(((!dataset[dn]?0:dataset[dn].up)/sc).toFixed(_dec)*1)
			if(inc_rd){
				rdv=!monthly_totals.pnd[dn]?null:(((monthly_totals.pnd[dn].down+monthly_totals.pnd[dn].up)/sc).toFixed(_dec)*1)
				row_data.push(rdv==0?null:rdv)
			}
			if(inc_isp){
				ispv=!isp_totals[dn]?null:(((isp_totals[dn].down+isp_totals[dn].up)/sc).toFixed(_dec)*1)
				row_data.push(ispv)
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	
	function GetCummulativeGraphData(){
		debugtrace("GetCummulativeGraphData",arguments,3)
		var gr_scale=setGraphScale('TotalBytes'), series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Cummulative Usage (in '+gr_scale+')'
		graph_data.addColumn('number','YAMon - Downloads');
		graph_data.addColumn('number','YAMon - Uploads');
		series.push({color:yd_colour,type:'column',visibleInLegend:true,targetAxisIndex:0})
		series.push({color:yu_colour,type:'column',visibleInLegend:true,targetAxisIndex:0})
		SetCols(series)
		var rdv=0,ispv=0
		var dt=0,ut=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			dt+=(!dataset[dn]?0:dataset[dn].down)
			ut+=(!dataset[dn]?0:dataset[dn].up)
			if((!dataset[dn]||dataset[dn].down+dataset[dn].up)==0){
				row_data.push(null)
				row_data.push(null)
			}
			else{
				row_data.push((dt/sc).toFixed(_dec)*1)
				row_data.push((ut/sc).toFixed(_dec)*1)
			}
			if(inc_rd){
				rdv+=!monthly_totals.pnd[dn]?0:(monthly_totals.pnd[dn].down+monthly_totals.pnd[dn].up)
				row_data.push((!monthly_totals.pnd[dn]||monthly_totals.pnd[dn].down+monthly_totals.pnd[dn].up==0)?null:(rdv/sc).toFixed(_dec)*1)
			}
			if(inc_isp){
				ispv+=!isp_totals[dn]?0:(isp_totals[dn].down+isp_totals[dn].up)
				row_data.push((!isp_totals[dn]||(isp_totals[dn].down+isp_totals[dn].up)==0)?null:(ispv/sc).toFixed(_dec)*1)
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	
	function GetAbsDiffGraphData(){
		debugtrace("GetAbsDiffGraphData",arguments,3)
		var gr_scale='MB', series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Differences (in '+gr_scale+')'
		SetDiffCols(series)
		var rdd=0,rdu=0,rdt=0
		var idd=0,idu=0,idt=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			if(inc_rd){
				rdd=monthly_totals.pnd[dn].dn_d
				rdu=monthly_totals.pnd[dn].up_d
				rdt=rdd+rdu
				row_data.push((rdd/sc).toFixed(_dec)*1)
				row_data.push((rdu/sc).toFixed(_dec)*1)
				row_data.push((rdt/sc).toFixed(_dec)*1)
			}
			if(inc_isp){
				idd=$(this).find('.i-d').attr('d')*1
				idu=$(this).find('.i-u').attr('d')*1
				idt=idd+idu
				row_data.push((idd/sc).toFixed(_dec)*1)
				row_data.push((idu/sc).toFixed(_dec)*1)
				row_data.push((idt/sc).toFixed(_dec)*1)
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	
	function GetPerDiffGraphData(){
		debugtrace("GetAbsDiffGraphData",arguments,3)
		var gr_scale='%', series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Differences (in '+gr_scale+')'
		SetDiffCols(series)
		var rdd=0,rdu=0,rdt=0
		var idd=0,idu=0,idt=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			if(inc_rd){
			   if(monthly_totals.pnd[dn].dn_p==0 && monthly_totals.pnd[dn].up_p ==0){
					row_data.push(null)
					row_data.push(null)
					row_data.push(null)			   
				}
				else{
					rdd=monthly_totals.pnd[dn].dn_p*100
					rdu=monthly_totals.pnd[dn].up_p*100
					rdt=monthly_totals.pnd[dn].t_p*100
					row_data.push((rdd/sc).toFixed(_dec)*1)
					row_data.push((rdu/sc).toFixed(_dec)*1)
					row_data.push((rdt/sc).toFixed(_dec)*1)
				}
			}
			if(inc_isp){
			  if($(this).find('.i-d').attr('p')==0 && $(this).find('.i-u').attr('p')==0){
					row_data.push(null)
					row_data.push(null)
					row_data.push(null)			   
				}
				else{
					idd=$(this).find('.i-d').attr('p')*1
					idu=$(this).find('.i-u').attr('p')*1
					idt=($(this).find('.i-d').attr('d')*1+$(this).find('.i-u').attr('d')*1)/($(this).find('.downloads').attr('value')*1+$(this).find('.uploads').attr('value')*1)*100
					row_data.push((idd/sc).toFixed(_dec)*1)
					row_data.push((idu/sc).toFixed(_dec)*1)
					row_data.push((idt/sc).toFixed(_dec)*1)
				}
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	
	function GetCummDiffGraphData(){
		debugtrace("GetCummDiffGraphData",arguments,3)
		var gr_scale='GB', series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Cummulative Differences (in '+gr_scale+')'
		SetDiffCols(series)
		var rdd=0,rdu=0,rdt=0
		var idd=0,idu=0,idt=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			if(inc_rd){
				if(monthly_totals.pnd[dn].dn_d==0 && monthly_totals.pnd[dn].up_d==0){
					row_data.push(null)
					row_data.push(null)
					row_data.push(null)			   
				}
				else{
					rdd+=monthly_totals.pnd[dn].dn_d
					rdu+=monthly_totals.pnd[dn].up_d
					rdt=rdd+rdu
					row_data.push((rdd/sc).toFixed(_dec)*1)
					row_data.push((rdu/sc).toFixed(_dec)*1)
					row_data.push((rdt/sc).toFixed(_dec)*1)
				}
			}
			if(inc_isp){
			   if($(this).find('.i-d').attr('d')==0 && $(this).find('.i-u').attr('d')==0){
					row_data.push(null)
					row_data.push(null)
					row_data.push(null)			   
				}
				else{
					idd+=$(this).find('.i-d').attr('d')*1
					idu+=$(this).find('.i-u').attr('d')*1
					idt=idd+idu
					row_data.push((idd/sc).toFixed(_dec)*1)
					row_data.push((idu/sc).toFixed(_dec)*1)
					row_data.push((idt/sc).toFixed(_dec)*1)
				} 
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	
	function GetCummPerDiffGraphData(){
		debugtrace("GetCummPerDiffGraphData",arguments,3)
		var gr_scale='%', series=[]
		var sc=gr_scales[gr_scale]||g_toKB
		options['title']+=' (in '+gr_scale+')'
		options['vAxes'][0]['title']+='Cummulative Differences (in '+gr_scale+')'
		SetDiffCols(series)
		var rdd=0,rdu=0,rdt=0
		var idd=0,idu=0,idt=0
		var yd=0,yu=0,yt=0
		$('.mb-row').each(function(){
			var dn=$(this).attr('id').split('-')[3]*1
			var row_data=[]
			row_data.push(($(this).find('.mbd-date').hasClass('flagged')?'* ':'')+dn)
			yd+=$(this).find('.downloads').attr('value')*1
			yu+=$(this).find('.uploads').attr('value')*1
			yt=yd+yu
			if(inc_rd){
			   if(monthly_totals.pnd[dn].dn_d==0 && monthly_totals.pnd[dn].up_d==0){
					row_data.push(null)
					row_data.push(null)
					row_data.push(null)			   
				}
				else{
					rdd+=monthly_totals.pnd[dn].dn_d
					rdu+=monthly_totals.pnd[dn].up_d
					rdt=rdd+rdu
					row_data.push((100*rdd/yd).toFixed(_dec)*1)
					row_data.push((100*rdu/yu).toFixed(_dec)*1)
					row_data.push((100*rdt/yt).toFixed(_dec)*1)
				}
			}
			if(inc_isp){
			  if($(this).find('.i-d').attr('d')==0 && $(this).find('.i-u').attr('d')==0){
					row_data.push(null)
					row_data.push(null)
					row_data.push(null)			   
				}
				else{
					idd+=$(this).find('.i-d').attr('d')*1
					idu+=$(this).find('.i-u').attr('d')*1
					idt=idd+idu
					row_data.push((100*idd/yd).toFixed(_dec)*1)
					row_data.push((100*idu/yu).toFixed(_dec)*1)
					row_data.push((100*idt/yt).toFixed(_dec)*1)
				}
			} 
			graph_data.addRow(row_data)
		})
		options['series']=series
	}	   
	debugtrace("DrawGraph",arguments,3)
	$('#gr-'+wg)[$('#'+wg).is(':checked')&&$('#'+wg).parents('label').is(':visible')?'show':'hide']()
	if(!$('#'+wg).parents('label').is(':visible')) return
	if(!$('#'+wg).is(':checked'))return
   
	var w_ya='.'+wg, cn='',w_yu, w_yd, w_isp,w_td,w_a,is_pct=false,noyamon=false,is_cpct=false,is_tot=(wg=='cb-tot'),ct,g_sc,gr_scale,loc='column'
	var un=$('#mb-filter').val()
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
	var dec=_dec
	var inc_rd=$('#ShowRD').is(':checked')&& un==='ALL',inc_isp=$('#showISP').is(':checked')&& un==='ALL'
	var gr_scale,gr_scales=[]
	gr_scales['%']=1
	gr_scales['GB']=g_toGB
	gr_scales['MB']=g_toMB
	gr_scales['kB']=g_toKB
	var mo=twod(_rs_Date.getMonth()+1),yr=_rs_Date.getFullYear()
	if(!g_Settings['isp'][mo+'-'+yr]){
		var isp_totals={}
	}
	else{
		var isp_totals=JSON.parse(g_Settings['isp'][mo+'-'+yr])
	}
	var graph_data=new google.visualization.DataTable();
	graph_data.addColumn('string','Day');

	var yd_colour='mediumblue',yu_colour='mediumturquoise',y_colour='blue'
	var options={width:1000,height:400,title:'',legend:{position:'top'},isStacked:true,hAxis:{textStyle:{fontSize:9},title:$('.current-interval').first().text(),slantedText:true,titleTextStyle:{f:'green'}},vAxes:{0:{title:'',titleTextStyle:{color:'green'},minValue:0}},series:{}};
	var ispname=$('#isp-name').val()||'ISP'

	switch (wg) {
		case 'cb-down':
			options['title']='Downloads by Day'
			GetDownloadGraphData()
			break;
		case 'cb-up':
			options['title']='Uploads by Day'
			GetUploadGraphData()
			break;
		case 'cb-tot':
			options['title']='Total Traffic by Day'
			GetTotalGraphData()
			break;
	   case 'cb-cum':
			options['title']='Cumulative Traffic'
			GetCummulativeGraphData()
			break;
	   case 'cb-dif':
			options['title']='Absolute Differences from YAMon'
			GetAbsDiffGraphData()
			break;
	   case 'cb-difp':
			options['title']='Differences from YAMon'
			GetPerDiffGraphData()
			break;
	   case 'cb-cdif':
			options['title']='Cummulative Differences from YAMon'
			GetCummDiffGraphData()
			break;
	   case 'cb-cdifp':
			options['title']='Cummulative Differences from YAMon'
			GetCummPerDiffGraphData()
			break;
	}
	var chart=new google.visualization.ColumnChart(document.getElementById('gr-'+wg));
	chart.draw(graph_data, options);
}
function setGraphScale(range){
	debugtrace("setGraphScale",arguments,3)
	var gr=$('#bdFooter .' + range).first()
	if(gr.hasClass('GBytes')&&Number(gr.text()>10)) return 'GB'
	if(gr.hasClass('GBytes')) return 'MB'
	if(gr.hasClass('MBytes')&&Number(gr.text()>10)) return 'MB'
	return 'KB'
}
function set_bd_graphs(){
	debugtrace("set_bd_graphs",arguments,3)
	var bd_graphs=[]
	$('.gr-cb').each(function(){
		g_Settings['graphs'][$(this).attr('id')]=$(this).is(':checked')
	})
	saveSettings()
	$('.disabled-btn').removeClass('disabled-btn')
	$('#no-graphs')[$('.gr-cb:checked').length==0?'addClass':'removeClass']('disabled-btn')
	$('#all-graphs')[$('.gr-cb').length==$('.gr-cb:checked').length?'addClass':'removeClass']('disabled-btn')
}
function clearFilter(){
	debugtrace("clearFilter",arguments,3)
	$('#filterIP').text('')
	$('.filter').removeClass('filter')
	activeConnections()
}
function resetdates(){
	debugtrace("resetdates",arguments,3)
	var cd=new Date()
	$('#dateFMT-1').text(formattedDate(cd,0))
	$('#dateFMT-2').text(formattedDate(cd,1))
	$('#dateFMT-3').text(formattedDate(cd,2))
	if(!_cr_Date) return
	$('.current-date').text(formattedDate(_cr_Date))
	$('.current-interval').text(formattedDate(_rs_Date)+' - '+formattedDate(_re_Date))
	$('#monthly-breakdown-tab').removeClass('loaded')
	$('#MonthlyBreakdown').html('')
	if($('#monthly-breakdown-tab-section').is(':visible')) monthlyBreakdown()
	DrawHourlyGraph()
}
function formattedDate(d,v){
	debugtrace("formattedDate",arguments,3)
	var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
	var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
	if (typeof(v)=='undefined') v=$('#dateFMT').val()*1 

	var sep=$('#dateSep').val(),ret=''
	var da=days[d.getDay()],dn=twod(d.getDate()),m=twod(d.getMonth()+1),mn=months[d.getMonth()],y=d.getFullYear()
	switch (v) {
		case 0:
			ret=da+' '+mn+sep+dn+sep+y
			break
		case 1:
			ret=da+' '+dn+sep+mn+sep+y
			break
		case 2:
			ret=da+' '+dn+sep+m+sep+y
			break
	}
	return ret
}
function createdb(){
	debugtrace("createdb",arguments,3)
	var ss=JSON.stringify(g_Settings)
	localStorage.setItem('Settings',ss)
	showLoading('Creating Settings Database...')
	var domain='http://usage-monitoring.com'
	if(g_Settings['useHTTPS']) domain='https://usagemonitoringcom.ipage.com'
	var request = $.ajax({
		url: domain+"/db/createdb.php",
		type: "POST",
		data: {settings:ss },
		dataType: "json"
	});
	request.done(function( data ) {
		if (data.response == 'error') {
			alert( data.comment );
			return
		}
		$('#getKey,#dbkey-needtoclick').remove()
		$('#dbkey').val(data.dbkey).fadeIn('slow')
		$('#dbkey-clicked').fadeIn('slow')
		clearLoading()
	});
	request.fail(function( jqXHR, textStatus ) {
		alert( "Request failed: " + textStatus );
	});
}