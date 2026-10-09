<script>
window.addEventListener('load', async function(){
  var R=[]; function t(n,c){R.push((c?'PASS ':'FAIL ')+n)}
  var $=function(i){return document.getElementById(i)}; var w=function(ms){return new Promise(r=>setTimeout(r,ms))};
  try { localStorage.clear(); } catch(e) {}
  var calls=[], queue=[];
  window.fetch=function(u,o){ calls.push({url:u, body:JSON.parse(o.body)}); var n=queue.shift()||{status:200,body:{ok:true}}; return Promise.resolve({ok:n.status===200,status:n.status,json:()=>Promise.resolve(n.body)}); };
  try{
  t('feedback button visible', !$('fbOpen').hidden);
  t('card feedback row present', !!document.querySelector('#ocard .card-fb'));
  // No saved passcode: Helpful opens the dialog with a passcode field
  var btns=document.querySelectorAll('#ocard .card-fb .btn'); btns[0].click(); await w(20);
  t('dialog opens asking for passcode', $('fbDialog').open && !$('fbPassRow').hidden);
  $('fbPass').value='pc-1'; $('fbName').value='Jo'; $('fbSend').click(); await w(50);
  var b=calls[0].body;
  t('helpful card sent via dialog', calls[0].url.endsWith('/feedback') && b.kind==='card' && b.target==='cost' && b.helpful===true && b.passcode==='pc-1' && b.name==='Jo' && /^\d{4}-/.test(b.page_version));
  await w(1300);
  t('dialog closes, passcode remembered', !$('fbDialog').open && localStorage.getItem('pinnacle-objection-lab-passcode')==='pc-1');
  // Saved passcode: Needs work opens inline note
  [...document.querySelectorAll('#olist .obtn')].find(x=>/think about it/.test(x.textContent)).click(); await w(10);
  btns=document.querySelectorAll('#ocard .card-fb .btn'); btns[1].click(); await w(10);
  var note=document.querySelector('#ocard .card-fb-note textarea');
  t('inline note shown', !!note);
  note.value='The ask feels pushy'; document.querySelector('#ocard .card-fb-note .btn').click(); await w(50);
  b=calls[1].body;
  t('needs-work note sent', b.kind==='card' && b.target==='think' && b.helpful===false && b.message==='The ask feels pushy' && b.name==='Jo');
  // Error path
  queue.push({status:401, body:{error:'bad_passcode'}});
  $('fbOpen').click(); await w(10);
  t('general dialog hides passcode once saved', $('fbPassRow').hidden);
  $('fbType').value='missing'; $('fbMessage').value='We need "we tried a coach already"'; $('fbSend').click(); await w(50);
  t('error shown in dialog', /passcode didn/.test($('fbStatus').textContent) && $('fbDialog').open);
  $('fbSend').click(); await w(50);
  b=calls[3].body;
  t('general feedback sent', b.kind==='general' && b.target==='missing' && /tried a coach/.test(b.message));
  await w(1300);
  // Role-play rating
  queue.push({status:200, body:{reply:"We already have a coach."}});
  $('tab-roleplay').click(); $('rpPass').value='pc-1'; $('rpStart').click(); await w(50);
  queue.push({status:200, body:{reply:"Mostly strategy."}});
  $('rpInput').value="What does your coach help with?"; $('rpSend').click(); await w(50);
  queue.push({status:200, body:{reply:"FEEDBACK\n1. Framed early: No."}});
  $('rpEnd').click(); await w(50);
  t('rating panel shown after feedback', !$('rpRate').hidden && document.querySelectorAll('#rpRate .seg button').length===10);
  $('rpRateSend').click(); t('rating needs input', /Pick a rating/.test($('rpRateStatus').textContent));
  document.querySelectorAll('#rpRate .seg')[0].querySelectorAll('button')[3].click();
  document.querySelectorAll('#rpRate .seg')[1].querySelectorAll('button')[4].click();
  $('rpRateMsg').value='Prospect caved too fast'; $('rpRateTranscript').checked=true; $('rpRateSend').click(); await w(50);
  b=calls[calls.length-1].body;
  t('rating sent with transcript', b.kind==='roleplay' && b.rating_realism===4 && b.rating_feedback===5 && /caved/.test(b.message) && /Prospect: We already have a coach/.test(b.transcript) && /Guide: What does your coach/.test(b.transcript) && /Feedback:/.test(b.transcript) && b.target.indexOf('|')>0);
  $('rpReset').click(); t('rating hidden on new role-play', $('rpRate').hidden);
  // Transcript is opt-in
  queue.push({status:200, body:{reply:"Hi."}}); $('rpStart').click(); await w(50);
  queue.push({status:200, body:{reply:"FEEDBACK\nok"}}); $('rpEnd').click(); await w(50);
  document.querySelectorAll('#rpRate .seg')[0].querySelectorAll('button')[1].click(); $('rpRateSend').click(); await w(50);
  t('no transcript unless opted in', !('transcript' in calls[calls.length-1].body));
  t('no horizontal overflow', document.documentElement.scrollWidth<=window.innerWidth);
  }catch(e){R.push('ERROR '+e.message)}
  var pre=document.createElement('pre'); pre.id='TEST'; pre.textContent=R.join('\n'); document.body.append(pre);
});
</script>
