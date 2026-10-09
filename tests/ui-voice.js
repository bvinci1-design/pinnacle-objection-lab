<script>
window.addEventListener('load', async function(){
  var R=[]; function t(n,c){R.push((c?'PASS ':'FAIL ')+n)}
  var $=function(i){return document.getElementById(i)}; var w=function(ms){return new Promise(r=>setTimeout(r,ms))};
  var calls=[]; window.fetch=function(u,o){ calls.push(JSON.parse(o.body)); return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({reply:"Okay, go on."})}); };
  try{
  $('tab-roleplay').click();
  t('mic + pause select visible', !$('rpMic').hidden && !$('rpAutoRow').hidden && $('rpPause').value==='3000');
  $('rpPass').value='x'; $('rpStart').click(); await w(50);
  $('rpMic').click(); var r=window.__recs[window.__recs.length-1];
  t('continuous listening', r.continuous===true && r.started && $('rpMic').textContent==='Stop');
  r.say(["That makes sense"]); await w(1500);
  t('no send during 1.5s pause', calls.length===1);
  r.say(["That makes sense", " what does your coach help with"]); await w(2500);
  t('still not sent 2.5s after resuming', calls.length===1 && /coach help with/.test($('rpInput').value));
  await w(800);
  t('sent ~3s after last speech', calls.length===2 && /That makes sense what does your coach help with/.test(calls[1].turns[calls[1].turns.length-1].content));
  t('mic reset', $('rpMic').textContent==='Speak');
  await w(50);
  // browser ends session on its own mid-thought -> restarts, keeps text
  $('rpMic').click(); var r2=window.__recs[window.__recs.length-1]; r2.say(["First part"]); r2.onend(); await w(10);
  var r3=window.__recs[window.__recs.length-1];
  t('auto-restart after browser end', r3!==r2 && r3.started && /First part/.test($('rpInput').value) && calls.length===2);
  r3.say(["and second part"]); await w(3300);
  t('restart keeps earlier words', calls.length===3 && /First part and second part/.test(calls[2].turns[calls[2].turns.length-1].content));
  await w(50);
  // Off mode: never auto-sends
  $('rpPause').value='0'; $('rpPause').dispatchEvent(new Event('change'));
  $('rpMic').click(); var r4=window.__recs[window.__recs.length-1]; r4.say(["Manual one"]); await w(4000);
  t('off mode does not send', calls.length===3);
  $('rpMic').click(); await w(50);
  t('off mode stop leaves text for Send', calls.length===3 && /Manual one/.test($('rpInput').value) && $('rpMic').textContent==='Speak');
  }catch(e){R.push('ERROR '+e.message)}
  var pre=document.createElement('pre'); pre.id='TEST'; pre.textContent=R.join('\n'); document.body.append(pre);
});
</script>
