function covidGetByDate(dateStr, handler) {
  	$.get('https://api-covid19.rnbo.gov.ua/data?to='+dateStr,
	function(data,res,resp) {		
		var obj = window['CV_allByDate'];
		if(!obj)
			obj = {};
		 obj[dateStr] = data;
		 window['CV_allByDate'] = obj;
		 console.log(data);
		 if(handler)
			handler(dateStr, data);
	}).fail(
	function(err,data,resp) {
		console.log(err);
		if(handler)
			handler(dateStr, null);
	}
	);
}

function covidGetAllUkraine() {
  	$.get('https://api-covid19.rnbo.gov.ua/charts/main-data?mode=ukraine',
	function(data,res,resp) {
		window['CV_allUkraine'] = data;
	});
}

function toCovidDate(dt) {
	let month = dt.getMonth()+1;
	let year = dt.getFullYear();
	let dday = dt.getDate();

	return year+'-'+d2(month)+'-'+d2(dday);	
}

function covidGetToday(handler) {
	let dt = new Date();
	let frmt = toCovidDate(dt);
	
	var cvObj = window['CV_allByDate'];
	if(!cvObj || !cvObj[frmt])
		covidGetByDate(frmt, handler);
	else if(handler)
		handler(frmt, cvObj[frmt]);	
}



function covidGetWorldTotal(worldArr) {
	let w = { confirmed:0, deaths:0, recovered: 0, suspicion: 0, delta_confirmed:0, delta_deaths:0, delta_recovered:0, delta_suspicion: 0, label2: 'World'};
	for(let i=0;i<worldArr.length; i++) {
		w.confirmed+=worldArr[i].confirmed;
		w.deaths+=worldArr[i].deaths;
		w.recovered+=worldArr[i].recovered;
		w.delta_confirmed+=worldArr[i].delta_confirmed;
		w.delta_deaths+=worldArr[i].delta_deaths;
		w.delta_recovered+=worldArr[i].delta_recovered;			
	}
	
	return w;
}

function covidGetUkraineTotal(arr) {
	let w = { confirmed:0, deaths:0, recovered: 0, suspicion: 0, delta_confirmed:0, delta_deaths:0, delta_recovered:0, delta_suspicion:0, label2: 'Ukraine'};	
	for(let i=0;i<arr.length; i++) {
		w.confirmed+=arr[i].confirmed;
		w.deaths+=arr[i].deaths;
		w.recovered+=arr[i].recovered;
		w.suspicion+=arr[i].suspicion;
		
		w.delta_confirmed+=arr[i].delta_confirmed;
		w.delta_deaths+=arr[i].delta_deaths;
		w.delta_recovered+=arr[i].delta_recovered;
		w.delta_suspicion+=arr[i].delta_suspicion;					
	}	
	return w;
}

function d2(n){ return n<10?('0'+n):n; }

$(window).on('load', function() {
	/*var mapSvg = $(document.getElementById('mapSvg').contentDocument);
	
	mapSvg.find('path').click(function(e){ 
		$(this).parent().find('path').removeAttr('fill'); 
		$(this).attr('fill','#4a4a4a'); 
	});	*/
	
});