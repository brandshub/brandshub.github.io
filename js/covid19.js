function covidGetByDate(dateStr, handler) {
  	$.get('https://api-covid19.rnbo.gov.ua/data?to='+dateStr,
	function(data,res,resp) {		
		var obj = window['CV_allByDate'];
		if(!obj)
			obj = {};
		 obj[dateStr] = data;
		 window['CV_allByDate'] = obj;
		 
		 window['allRegions'] = getAllCountries(data);
		 //console.log(data);
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

function getAllCountries(responseObj) {
	let arr = [];
	
	for(let i=0;i<responseObj.world.length;i++)
		arr.push( { id: responseObj.world[i].id, label: responseObj.world[i].label, text:responseObj.world[i].country});
	
	for(let i=0;i<responseObj.ukraine.length;i++)
		arr.push( { id: responseObj.ukraine[i].country, label: responseObj.ukraine[i].label, text:'Ukraine: '+responseObj.ukraine[i].label.en});
	
	return arr;
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
	
	var cvvObj = window['CV_allUkraine_V'];
	if(!cvvObj)
	{
		covidGetUkraineAllTimeVaccinations(function(data) {			
			var cvObj = window['CV_allByDate'];
			if(!cvObj || !cvObj[frmt])
				covidGetByDate(frmt, handler);
			else if(handler)
				handler(frmt, cvObj[frmt]);	
		});
	}
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

function rgnCmp(a, b) {
  var nameA = a.label.en.toUpperCase(); // ignore upper and lowercase
  var nameB = b.label.en.toUpperCase(); // ignore upper and lowercase
  if (nameA < nameB) {
	return -1;
  }
  if (nameA > nameB) {
	return 1;
  }

  // names must be equal
  return 0;
}

function d2(n){ return n<10?('0'+n):n; }

// charts code star here

function covidGetUkraineAllTime(callback) {
	if(window['CV_allUkraine']) {
		callback(window['CV_allUkraine']);
		return;
	}
	
	$.get('https://api-covid19.rnbo.gov.ua/charts/main-data?mode=ukraine',
		function(data,res,resp) {
			addDeltaData(data);			
			window['CV_allUkraine'] = data;
			callback(data);
		});
	
}

function tryGetHealthApiIndex() {
	var apiIndex = localStorage.getItem('apiIndex');
	if(!apiIndex) {		
		apiIndex = getApiIndexFromUserAgent();
		localStorage.setItem('apiIndex',apiIndex);		
	}
	return apiIndex;
}

function getApiIndexFromUserAgent() {
	if( /Android|webOS|iPhone|iPad|Mac|Macintosh|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) 
		return 0;
	return 1;
}


function getHealthApiByClient(index) {
	
	return ['https://m-health-security.rnbo.gov.ua/api/vaccination/process/chart?vaccines=&dose=1&distributionBy=vaccine&regionId=',
	 'https://health-security.rnbo.gov.ua/api/vaccination/process/chart?vaccines=&dose=1&distributionBy=vaccine&regionId='][index];	
}


function covidGetUkraineAllTimeVaccinations(callback) {
	if(window['CV_allUkraine_V']) {
		callback(window['CV_allUkraine_V']);
		return;
	}
	var apiIndex = tryGetHealthApiIndex();
	 
	var innerHanlder = function(data,res,resp) {
		    
			var keys = Object.keys(data.daily.quantity);//.slice(1);					
			var arr = new Array(data.daily.dates.length);
			var qarr = new Array(data.daily.dates.length);
			
			for(var i=0;i<data.daily.dates.length;i++)
			{
				var sum = 0;
				var qsum = 0;
				for(var j=0;j<keys.length;j++) {
					sum += data.daily.cumulative[keys[j]][i];
					qsum+= data.daily.quantity[keys[j]][i];
				}
				arr[i]=sum;
				qarr[i]=qsum;
			}
			data.daily.cumulative.totals = arr;
			data.daily.cumulative.qtotals = qarr;
			
			var allSum =0;
			var dtlen= data.monthly.dates.length-1;
			
			for(var j=0;j<keys.length;j++)
				allSum+= data.monthly.cumulative[keys[j]][dtlen];
			
			data.allSum = allSum;
			localStorage.setItem('apiIndex', apiIndex);
			
			window['CV_allUkraine_V'] = data;
			window['CV_VacMap'] = [{t:'AstraZeneca',c:'#fb9e80'},{t:'Sinovac (CoronaVac)',c:'#e25d6d'},{t:'Pfizer-BioNTech',c:'#4584ca'},{t:'Moderna',c:'#3db19b'}];
			if(callback)
				callback(data);
		};
	
	$.ajax({
		type: 'GET',
		url: getHealthApiByClient(apiIndex),
		success: innerHanlder,
		error: function() {
		if(apiIndex==0)
			apiIndex = 1;
		else
			apiIndex = 0;
	
	console.log('swapped apiIndex to '+apiIndex);
		$.get(getHealthApiByClient(apiIndex),innerHanlder);		
	}});
	
}

function addDeltaData(data) {
	 var deltaCases = [0];
	 var deltaDeaths = [0];	  
	

	// remove today if 0
	if(data.confirmed[data.dates.length-1] == data.confirmed[data.dates.length-2])
		data.dates.pop();

	var maxDc = 0, maxDd = 0;
	 
	for(var i=1;i<data.dates.length;i++) {
		var dc = data.confirmed[i] - data.confirmed[i-1];
		if(dc > maxDc)
			maxDc = dc;
			
		var dd = data.deaths[i] - data.deaths[i-1];
		if(dd > maxDd)
			maxDd = dd;
			
		deltaCases.push(dc);
		deltaDeaths.push(dd);
	}
		
	data.deltaCases = deltaCases;
	data.deltaDeaths = deltaDeaths;
	data.maxDc = maxDc;
	data.maxDd = maxDd;
	
	
}

function getSmoothed(obj, key, n) {
	 var arr = [];
		  
	 for(var i=0;i<n;i++) {
		var sum = 0;
		for(var j=0;j<=i;j++)
			sum+=obj[key][j];
			
		arr.push({t:new Date(obj.dates[i]), y:1.0*sum/(i+1)});
	  }
	  
	for(var i=n;i<obj.dates.length;i++) {
		var sum = 0;
		for(var j=0;j<n;j++)
			sum += obj[key][i-j];
			
		arr.push({t:new Date(obj.dates[i]), y: 1.0 * sum / n});
	}		
	return arr;	
}


function getRaw(obj, key, n) {
	 var arr = []; 
	 
	for(var i=0;i<obj.dates.length;i++) {
		arr.push({t:new Date(obj.dates[i]), y: obj[key][i]});
	}		
	
	return arr;	
}

function showUkraineChart () {
	if($('#main-chart-ukr').length == 0) {
		covidGetUkraineAllTime(function(data){ createDivForChart(data, $('#rgn-ukraine'),'ukr');});
	}
}

function showUkraineVacChart() {
	if($('#main-chart-vac-ukr').length == 0) {
		createDivForVacChart(window['CV_allUkraine_V'], $('#ukraine-vac'),'ukr');
	}
}

function arrSlice(arr, n) {
	return arr.slice(Math.max(arr.length - n, 0));			
}

function ensureConfigCorrect(obj) {
	if(!obj)
		return { 'deaths': true, 'cases': true, 'display':'line', 'mode':'both', 'range':180 };
	
	if(!obj.display)
		obj.display='line';
	
	return obj;
}

function createDivForChart(inputData,baseDiv,id) {	
	var userChartConfig = ensureConfigCorrect(getLocalStorageObjectItem('userChartConfig'));
	
	var cId = 'chart-'+id;
	$(baseDiv).after('<div id="main-'+cId+'" class="row m-0 border" style="color:#666666">' +
	'<div class="col-12" style="height:25px" id="header-'+cId+'"><div style="float:right;padding-top: 5px;cursor: pointer;color:#666666" onclick="hideChart(\''+cId+'\')">[x]</div></div>' +
	'<div class="col-12" id="c-'+cId+'"><canvas id="'+cId+'"></canvas></div>'+
	'<div class="col-12 text-right" style="float:right;height:30px">' +
	//'<label for="chartLen">Date Range Length:</label><input id="chartLen" type="number" step="1"></input>' +
	'<input type="checkbox" id="cases-'+cId+'" style="font-size:11px" '+(userChartConfig.cases?'checked':'')+' onclick="updateChart(\''+cId+'\')">&nbsp;Cases</input>'+
	'<input type="checkbox" id="deaths-'+cId+'" class="ml-1" style="font-size:11px" '+(userChartConfig.deaths?'checked':'')+' onclick="updateChart(\''+cId+'\')">&nbsp;Deaths</input>'+
	'<select id="display-'+cId+'" class="ml-2" style="font-size:11px" onchange="updateChart(\''+cId+'\')"><option value="bar">Bar</option><option value="line">Line</option></select>'+
	'<select id="avg-'+cId+'" class="ml-1" style="font-size:11px" onchange="updateChart(\''+cId+'\')">' +
	'<option value="data">Data Only</option><option value="avg">Avg Only</option><option value="both" selected>Data & Avg</option></select>'+
	'</div></div>');
	
	$('#main-'+cId).hide();
	
	$('#avg-'+cId).val(userChartConfig.mode);
	$('#display-'+cId).val(userChartConfig.display ? userChartConfig.display : 'line');
	
	var ctx = document.getElementById(cId).getContext('2d');
	ctx.canvas.height = getViewportWidth() > 768 ? 500 : 640;
	ctx.canvas.width = 1000;

	document.getElementById(cId).style.backgroundColor = '#212529'		
	
	var f_avg = userChartConfig.mode == 'both' || userChartConfig.mode =='avg';
	var f_data = userChartConfig.mode == 'both' || userChartConfig.mode =='data';
	
	
	
	var cfg = {
		data: {
			datasets: [
			{
				label: 'Deaths 7d',
				backgroundColor: '#ff6271',
				borderColor: '#ff6271',
				data: arrSlice(getSmoothed(inputData,'deltaDeaths',7),userChartConfig.range),
				type: 'line',
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-deaths',
				hidden: !(userChartConfig.deaths && (userChartConfig.mode == 'both' || userChartConfig.mode == 'avg'))
			},
			{
				label: 'Cases 7d',
				backgroundColor: '#ffc107',
				borderColor: '#ffc107',					
				data: arrSlice(getSmoothed(inputData,'deltaCases',7),userChartConfig.range),
				type: 'line',
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-cases',
				hidden: !(userChartConfig.cases && (userChartConfig.mode == 'both' || userChartConfig.mode == 'avg'))
			},
			{
				label: 'Cases',
				backgroundColor: ('#ffc107'+(f_avg?'35':'')),
				borderColor: ('#ffc107'+(f_avg?'35':'')),
				data: arrSlice(getRaw(inputData,'deltaCases'),userChartConfig.range),
				type: userChartConfig.display,
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-cases',
				hidden: !(userChartConfig.cases && (userChartConfig.mode == 'both' || userChartConfig.mode == 'data'))
			},
			{
				label: 'Deaths',
				backgroundColor: ('#ff6271'+(f_avg?'35':'')),
				borderColor: ('#ff6271'+(f_avg?'35':'')),
				data: arrSlice(getRaw(inputData,'deltaDeaths'),userChartConfig.range),
				type: userChartConfig.display,
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-deaths',
				hidden: !(userChartConfig.deaths && (userChartConfig.mode == 'both' || userChartConfig.mode == 'data'))
			}
			
			]
		},
		options: {
			animation: {
				duration: 50
			},
			legend: {
				display: false
			},
			scales: {
				xAxes: [{
					type: 'time',
					distribution: 'series',
					offset: true,
					ticks: {													
						source: 'data',
						autoSkip: true,
						autoSkipPadding: 75,
						maxRotation: 0,
						sampleSize: 100							
					}
				}],
				yAxes: [ getCasesAxis(inputData,userChartConfig), getDeathsAxis(inputData,userChartConfig) ]
			},
			tooltips: {
				intersect: false,
				mode: 'index',
				callbacks: {
					label: function(tooltipItem, myData) {
						var label = myData.datasets[tooltipItem.datasetIndex].label || '';
						if (label) {
							label += ': ';
						}
						label += parseFloat(tooltipItem.value).toFixed(2);
						return label;
					}
				}
			}/*,
			plugins: {
						zoom: {							 
							zoom: {
							  enabled: true,
							  mode: 'xy', // or 'x' for "drag" version
							//  drag:{enabled:true,},
							  
							},
						}
					}*/
		}
	};

	var chart = new Chart(ctx, cfg);
	
	$('#main-'+cId).fadeIn(1000);
}



function createDivForVacChart(inputData,baseDiv,id) {	

	var lastVacDisplay = localStorage.getItem('vacDisplay');
	if(!lastVacDisplay)
		lastVacDisplay = 'weekly';
	
	var cId = 'chart-vac-'+id;
	$(baseDiv).after('<div id="main-'+cId+'" class="row m-0 border" style="color:#666666">' +
	'<div class="col-12" style="height:25px" id="header-'+cId+'"><div style="float:right;padding-top: 5px;cursor: pointer;color:#666666" onclick="hideChart(\''+cId+'\')">[x]</div></div>' +
	'<div class="col-12" id="c-'+cId+'"><canvas id="'+cId+'"></canvas></div>'+
	'<div class="col-12 text-right" style="float:right;height:30px">' +	
	'<select id="display-'+cId+'" class="ml-2" style="font-size:11px" onchange="updateVacChart(\''+cId+'\')"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="daily">Daily</option></select></div></div>');
	
	$('#main-'+cId).hide();
	
	
	$('#display-'+cId).val(lastVacDisplay);
	
	var lrg = getViewportWidth() > 768;
	
	var ctx = document.getElementById(cId).getContext('2d');
	ctx.canvas.height = lrg ? 500 : 840;
	ctx.canvas.width = 1000;

	document.getElementById(cId).style.backgroundColor = '#212529';
	
	var vaccines = window.CV_VacMap;
	
	var chartDatasets = new Array(vaccines.length);
	for(var i=0;i<vaccines.length;i++) {
		chartDatasets[i] = {
				label: vaccines[i].t,
				backgroundColor: vaccines[i].c,
				borderColor:'pink',
				data: getVacData(inputData,lastVacDisplay,'quantity',vaccines[i].t),
				borderWidth:0
		};		
	}
	
	var legendObj = lrg ? ({display:true}) : ({display:true, labels : {boxWidth: 16, fontSize: 12}});
	var cfg = {
		type: 'bar',
		data: {
			labels: inputData[lastVacDisplay].dates,
			datasets: chartDatasets
		},
		options: {
			animation: {
				duration: 50
			},
			legend: legendObj,
			/*scales: {
				xAxes: [{					
					stacked:true
				}],
				yAxes: [{
					stacked:true
				}]
			},*/
			tooltips: {
				intersect: false,
				mode: 'index',
				callbacks: {
					label: function(tooltipItem, data) {
							return data.datasets[tooltipItem.datasetIndex].label+" "+n3(parseInt(tooltipItem.yLabel));
					},
					footer: function(tooltipItems, data) {
						let total = 0;
						for (let i = 0; i < tooltipItems.length; i++) {
							total += parseInt(tooltipItems[i].yLabel, 10);
						}
						return '\r\nTotal: ' + n3(total);
					}
				}
				
			}
			/*plugins: {
						zoom: {
pan: {
	enabled:true,
	mode:'xy'
},
							
							zoom: {
							  enabled: true,
							  mode: 'xy', // or 'x' for "drag" version
							  //drag:{enabled:true,},
							  
							},
						}
					}*/
		}
	};

	var chart2 = new Chart(ctx, cfg);
	
	$('#main-'+cId).fadeIn(1000);
}


function getVacData(mainObj, dateType, optionType, vacName) {
	var data = new Array(mainObj[dateType].dates.length);
	for(var i=0;i<data.length;i++) {
		data[i] = {x:mainObj[dateType].dates,y:mainObj[dateType][optionType][vacName][i]};
	}
	return data;	
}

function getCasesAxis(obj,config) {
	//data.maxDc = maxDc;
	//data.maxDd = maxDd;
	var max = obj.maxDc;	
	var realMax = 5000 * (1 + Math.floor(max / 5000));	
	
	var axis = 
	{
		position: (config.cases ? 'right':'left'),
		id: 'y-cases',
		display: config.cases,
		gridLines: {
			drawBorder: false,
			color:'#333'
		},
		scaleLabel: {
			display: true,
			lineWidth:0.5,
			labelString: 'Cases'
		},
		ticks: {
			max: realMax,
			min: 0,
			stepSize: realMax/10
		}
	};
	return axis;
}

function getDeathsAxis(obj,config) {
	var max = obj.maxDd;	
	var div = config.cases ? 1000 : 250
	var realMax = div * (1 + Math.floor(max / div));
	
	var axis =
	{
		position: config.cases ? 'left':'right',
		id: 'y-deaths',
		display: config.deaths,
		gridLines: {
			drawBorder: false,
			color:'#333'
		},
		scaleLabel: {
			display: true,
			lineWidth:0.5,
			labelString: 'Deaths'
		},
		ticks: {
			max: realMax,
			min: 0,
			stepSize: realMax/10
		}
	};
	return axis;
}




function updateChart(id) {
	var mode = document.getElementById('avg-'+id).value;
	var display = document.getElementById('display-'+id).value;
	
	var f_avg = mode == 'avg' || mode == 'both';
	var f_data = mode == 'data' || mode == 'both';
	
	var f_deaths = document.getElementById('deaths-'+id).checked;
	var f_cases = document.getElementById('cases-'+id).checked;
	
	var range = ensureConfigCorrect(getLocalStorageObjectItem('userChartConfig')).range;
	
	var userChartConfig = { 'deaths': f_deaths, 'cases': f_cases, 'display': display,'mode':mode, 'range': range  };
	
	setLocalStorageObjectItem('userChartConfig',userChartConfig);
	
	var inst;
	Chart.helpers.each(Chart.instances, function(instance){
	  if(instance.chart.canvas.id == id) {
		  inst = instance;
		  return;
	  }
	});
		
	if(inst) {	
		
		inst.config.data.datasets[0].hidden = !(f_avg && f_deaths);
		inst.config.data.datasets[1].hidden = !(f_avg && f_cases);
		
		inst.config.data.datasets[3].hidden = !(f_data && f_deaths);
		inst.config.data.datasets[2].hidden = !(f_data && f_cases);
		
		inst.config.data.datasets[2].backgroundColor = '#ffc107' + (f_avg ? '35':'');
		inst.config.data.datasets[2].borderColor = '#ffc107' + (f_avg ? '35':'');
		
		inst.config.data.datasets[3].backgroundColor = '#ff6271' + (f_avg ? '35':'');
		inst.config.data.datasets[3].borderColor = '#ff6271' + (f_avg ? '35':'');
		
		inst.config.data.datasets[2].type= userChartConfig.display;
		inst.config.data.datasets[3].type= userChartConfig.display;
		
		inst.config.options.scales.yAxes[0] = getCasesAxis(window['CV_allUkraine'], userChartConfig);
		inst.config.options.scales.yAxes[1] = getDeathsAxis(window['CV_allUkraine'], userChartConfig);
		
		inst.update();		
	}
}

function updateVacChart(id) {
	var display = document.getElementById('display-'+id).value;	
	localStorage.setItem('vacDisplay', display);
	
	var vaccines = window.CV_VacMap;
	
	var inst;
	Chart.helpers.each(Chart.instances, function(instance){
	  if(instance.chart.canvas.id == id) {
		  inst = instance;
		  return;
	  }
	});
		
	if(inst) {
		for(var i=0;i<vaccines.length;i++)
			inst.config.data.datasets[i].data  = getVacData(window['CV_allUkraine_V'],display,'quantity',vaccines[i].t),
		inst.config.data.labels = window['CV_allUkraine_V'][display].dates,
		inst.update();
	}
}


function hideChart(id) {
	$('#main-'+id).fadeOut(400, function(){ $(this).remove(); });	
} 

$(window).on('load', function() {
	/*var mapSvg = $(document.getElementById('mapSvg').contentDocument);
	
	mapSvg.find('path').click(function(e){ 
		$(this).parent().find('path').removeAttr('fill'); 
		$(this).attr('fill','#4a4a4a'); 
	});	*/
	
});