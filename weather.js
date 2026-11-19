(function(){
  'use strict';
  var form=document.getElementById('search-form');
  var input=document.getElementById('city-input');
  var statusEl=document.getElementById('status');
  var content=document.getElementById('weather-content');
  var unitButton=document.getElementById('unit-toggle');
  var locationButton=document.getElementById('location-button');
  var unit='celsius';
  var currentPlace=null;
  var weatherCodes={0:['Clear sky','☀'],1:['Mainly clear','🌤'],2:['Partly cloudy','⛅'],3:['Overcast','☁'],45:['Fog','🌫'],48:['Rime fog','🌫'],51:['Light drizzle','🌦'],53:['Drizzle','🌦'],55:['Heavy drizzle','🌧'],56:['Freezing drizzle','🌧'],57:['Freezing drizzle','🌧'],61:['Light rain','🌦'],63:['Rain','🌧'],65:['Heavy rain','🌧'],66:['Freezing rain','🌧'],67:['Freezing rain','🌧'],71:['Light snow','🌨'],73:['Snow','🌨'],75:['Heavy snow','❄'],77:['Snow grains','🌨'],80:['Rain showers','🌦'],81:['Rain showers','🌧'],82:['Heavy showers','🌧'],85:['Snow showers','🌨'],86:['Heavy snow showers','❄'],95:['Thunderstorm','⛈'],96:['Thunderstorm with hail','⛈'],99:['Thunderstorm with hail','⛈']};
  function weatherInfo(code){return weatherCodes[code]||['Conditions unavailable','·'];}
  function setStatus(message,isError){statusEl.textContent=message;statusEl.classList.toggle('error',Boolean(isError));}
  function safeText(value){return String(value==null?'':value);}
  function formatTime(iso,options){return new Intl.DateTimeFormat(undefined,Object.assign({hour:'numeric'},options||{})).format(new Date(iso));}
  function formatDay(iso){return new Intl.DateTimeFormat(undefined,{weekday:'short'}).format(new Date(iso));}
  function degrees(value){return Math.round(value)+'°';}

  async function searchCity(name){
    if(!name.trim()){setStatus('Enter a city name to search.',true);return;}
    setStatus('Finding '+name.trim()+'…');content.hidden=true;
    try{
      var response=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(name.trim())+'&count=1&language=en&format=json');
      if(!response.ok)throw new Error('Location search is temporarily unavailable. Please try again.');
      var result=await response.json();
      if(!result.results||!result.results.length)throw new Error('No matching city found. Try another location.');
      currentPlace=result.results[0];await loadWeather();
    }catch(error){setStatus(error.message||'Could not load the forecast. Check your connection and try again.',true);}
  }
  async function loadWeather(){
    if(!currentPlace)return;
    setStatus('Loading forecast…');content.hidden=true;
    try{
      var params=new URLSearchParams({latitude:currentPlace.latitude,longitude:currentPlace.longitude,current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',hourly:'temperature_2m,precipitation_probability,weather_code',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',forecast_days:'5',timezone:'auto',temperature_unit:unit,wind_speed_unit:unit==='celsius'?'kmh':'mph',precipitation_unit:unit==='celsius'?'mm':'inch'});
      var response=await fetch('https://api.open-meteo.com/v1/forecast?'+params.toString());
      if(!response.ok)throw new Error('Weather service is temporarily unavailable. Please try again.');
      var data=await response.json();render(data);content.hidden=false;setStatus('Updated just now · Local time in '+(currentPlace.name||'your location'));
    }catch(error){setStatus(error.message||'Could not load the forecast. Check your connection and try again.',true);}
  }
  function render(data){
    var now=data.current, info=weatherInfo(now.weather_code);
    document.getElementById('location-name').textContent=[currentPlace.name,currentPlace.admin1,currentPlace.country].filter(Boolean).join(', ');
    document.getElementById('local-time').textContent='Local time · '+formatTime(now.time,{hour:'numeric',minute:'2-digit'});
    document.getElementById('current-icon').textContent=info[1];
    document.getElementById('temperature').textContent=degrees(now.temperature_2m);
    document.getElementById('condition').textContent=info[0];
    document.getElementById('feels-like').textContent='Feels like '+degrees(now.apparent_temperature);
    document.getElementById('humidity').textContent=now.relative_humidity_2m+'%';
    document.getElementById('wind').textContent=Math.round(now.wind_speed_10m)+' '+(unit==='celsius'?'km/h':'mph');
    document.getElementById('precipitation').textContent=now.precipitation+' '+(unit==='celsius'?'mm':'in');
    var hourly=document.getElementById('hourly-list');hourly.replaceChildren();
    var start=data.hourly.time.findIndex(function(t){return t>=now.time;});if(start<0)start=0;
    for(var i=start;i<Math.min(start+24,data.hourly.time.length);i++){
      var h=document.createElement('div');h.className='hour-item';
      var time=document.createElement('time');time.textContent=i===start?'Now':formatTime(data.hourly.time[i]);
      var icon=document.createElement('span');icon.className='mini-icon';icon.setAttribute('aria-hidden','true');icon.textContent=weatherInfo(data.hourly.weather_code[i])[1];
      var temp=document.createElement('strong');temp.textContent=degrees(data.hourly.temperature_2m[i]);
      var rain=document.createElement('span');rain.textContent=data.hourly.precipitation_probability[i]+'% rain';
      h.append(time,icon,temp,rain);hourly.appendChild(h);
    }
    var daily=document.getElementById('daily-list');daily.replaceChildren();
    var highs=data.daily.temperature_2m_max, lows=data.daily.temperature_2m_min, min=Math.min.apply(null,lows), max=Math.max.apply(null,highs), span=Math.max(1,max-min);
    for(var d=0;d<data.daily.time.length;d++){
      var row=document.createElement('div');row.className='day-item';
      var day=document.createElement('time');day.textContent=d===0?'Today':formatDay(data.daily.time[d]);
      var dayIcon=document.createElement('span');dayIcon.className='mini-icon';dayIcon.setAttribute('aria-hidden','true');dayIcon.textContent=weatherInfo(data.daily.weather_code[d])[1];
      var range=document.createElement('div');range.className='range';
      var low=document.createElement('span');low.className='low';low.textContent=degrees(lows[d]);
      var track=document.createElement('span');track.className='range-track';track.setAttribute('aria-label','Temperature range');track.style.setProperty('--low',(100*(lows[d]-min)/span)+'%');
      var high=document.createElement('strong');high.textContent=degrees(highs[d]);range.append(low,track,high);
      var rainChance=document.createElement('span');rainChance.className='rain';rainChance.textContent=data.daily.precipitation_probability_max[d]+'% rain';
      row.append(day,dayIcon,range,rainChance);daily.appendChild(row);
    }
  }
  form.addEventListener('submit',function(event){event.preventDefault();searchCity(input.value);});
  unitButton.addEventListener('click',function(){unit=unit==='celsius'?'fahrenheit':'celsius';unitButton.setAttribute('aria-pressed',String(unit==='fahrenheit'));if(currentPlace)loadWeather();});
  locationButton.addEventListener('click',function(){
    if(!navigator.geolocation){setStatus('Location is not supported by this browser. Search for a city instead.',true);return;}
    setStatus('Getting your location…');
    navigator.geolocation.getCurrentPosition(function(position){currentPlace={name:'Your location',latitude:position.coords.latitude,longitude:position.coords.longitude};loadWeather();},function(){setStatus('Could not access your location. Check browser permission or search for a city.',true);},{timeout:10000});
  });
})();
