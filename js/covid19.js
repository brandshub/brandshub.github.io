function covidGetByDate(dateStr, handler) {
  	$.get('https://api-covid19.rnbo.gov.ua/data?to='+dateStr,
	function(data,res,resp) {		
		var obj = window['CV_allByDate'];
		if(!obj)
			obj = {};
		 obj[dateStr] = data;
		 window['CV_allByDate'] = obj;
		 
		 window['allRegions'] = getAllCountries(data);
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

function arrSlice(arr, n) {
	return arr.slice(Math.max(arr.length - n, 0));			
}

function createDivForChart(inputData,baseDiv,id) {	
	var userChartConfig = getLocalStorageObjectItem('userChartConfig');
	if(!userChartConfig) {
		userChartConfig = { 'deaths': true, 'cases': true, 'mode':'both', 'range':180 };
	}
	var cId = 'chart-'+id;
	$(baseDiv).after('<div id="main-'+cId+'" class="row m-0 border" style="color:#666666">' +
	'<div class="col-12" style="height:25px" id="header-'+cId+'"><div style="float:right;padding-top: 5px;cursor: pointer;color:#666666" onclick="hideChart(\''+cId+'\')">[x]</div></div>' +
	'<div class="col-12" id="c-'+cId+'"><canvas id="'+cId+'"></canvas></div>'+
	'<div class="col-12 text-right" style="float:right;height:30px">' +
	//'<label for="chartLen">Date Range Length:</label><input id="chartLen" type="number" step="1"></input>' +
	'<input type="checkbox" id="cases-'+cId+'" style="font-size:12px" '+(userChartConfig.cases?'checked':'')+' onclick="updateChart(\''+cId+'\')">&nbsp;Cases</input>'+
	'<input type="checkbox" id="deaths-'+cId+'" class="ml-3" style="font-size:12px" '+(userChartConfig.deaths?'checked':'')+' onclick="updateChart(\''+cId+'\')">&nbsp;Deaths</input>'+
	'<select id="avg-'+cId+'" class="ml-3" style="font-size:12px" onchange="updateChart(\''+cId+'\')">' +
	'<option value="data">Data Only</option><option value="avg">Avg Only</option><option value="both" selected>Data & Avg</option></select>'+
	'</div></div>');
	
	$('#avg-'+cId).val(userChartConfig.mode);
	
	
	var ctx = document.getElementById(cId).getContext('2d');
	ctx.canvas.height = 300;
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
				data: arrSlice(getSmoothed(inputData,'deltaDeaths',7),180),
				type: 'line',
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-axis-2',
				hidden: !(userChartConfig.deaths && (userChartConfig.mode == 'both' || userChartConfig.mode == 'avg'))
			},
			{
				label: 'Cases 7d',
				backgroundColor: '#ffc107',
				borderColor: '#ffc107',					
				data: arrSlice(getSmoothed(inputData,'deltaCases',7),180),
				type: 'line',
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-axis-1',
				hidden: !(userChartConfig.cases && (userChartConfig.mode == 'both' || userChartConfig.mode == 'avg'))
			},
			{
				label: 'Cases',
				backgroundColor: ('#ffc107'+(f_avg?'35':'')),
				borderColor: ('#ffc107'+(f_avg?'35':'')),
				data: arrSlice(getRaw(inputData,'deltaCases'),180),
				type: 'line',
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-axis-1',
				hidden: !(userChartConfig.cases && (userChartConfig.mode == 'both' || userChartConfig.mode == 'data'))
			},
			{
				label: 'Deaths',
				backgroundColor: ('#ff6271'+(f_avg?'35':'')),
				borderColor: ('#ff6271'+(f_avg?'35':'')),
				data: arrSlice(getRaw(inputData,'deltaDeaths'),180),
				type: 'line',
				pointRadius: 0,
				fill: false,
				lineTension: 0,
				borderWidth: 3,
				yAxisID: 'y-axis-2',
				hidden: !(userChartConfig.deaths && (userChartConfig.mode == 'both' || userChartConfig.mode == 'data'))
			}
			
			]
		},
		options: {
			animation: {
				duration: 0
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
				yAxes: [{
					position: 'left',
					id: 'y-axis-1',
					display: true,
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
						max: 20000,
						min: 0,
						stepSize: 2000
					}
				},
				{
					position: 'right',
					id: 'y-axis-2',
					display: true,
					gridLines: {
						drawBorder: false,		
						display:false
					},
					scaleLabel: {
						display: true,
						labelString: 'Deaths'
					},
					ticks: {
						max: 1000,
						min: 0,
						stepSize: 100
					}
				}
				]
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
			}
		}
	};

		var chart = new Chart(ctx, cfg);
	
	
}


function updateChart(id) {
	var mode = document.getElementById('avg-'+id).value;
	
	var f_avg = mode == 'avg' || mode == 'both';
	var f_data = mode == 'data' || mode == 'both';
	
	var f_deaths = document.getElementById('deaths-'+id).checked;
	var f_cases = document.getElementById('cases-'+id).checked;
	
	var userChartConfig = { 'deaths': f_deaths, 'cases': f_cases, 'mode':mode, 'range':180 };
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
					
		inst.update();		
	}
}


function hideChart(id) {
	$('#main-'+id).remove();
} 

$(window).on('load', function() {
	/*var mapSvg = $(document.getElementById('mapSvg').contentDocument);
	
	mapSvg.find('path').click(function(e){ 
		$(this).parent().find('path').removeAttr('fill'); 
		$(this).attr('fill','#4a4a4a'); 
	});	*/
	
});