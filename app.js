(function(){
  'use strict';
  var form=document.getElementById('lookup-form');
  if(form) form.addEventListener('submit',function(e){
    e.preventDefault();var input=document.getElementById('vin'), vin=input.value.trim();
    if(vin.length<5){input.setCustomValidity('Enter at least 5 characters for this demo.');input.reportValidity();return;}
    input.setCustomValidity('');
    window.location.href='sample-report.html?vin='+encodeURIComponent(vin);
  });
  var vinOut=document.getElementById('report-vin');
  if(vinOut){var params=new URLSearchParams(window.location.search);var vin=params.get('vin');if(vin)vinOut.textContent=vin.toUpperCase();}
})();
