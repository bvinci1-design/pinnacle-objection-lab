<script>
window.addEventListener('load', async function(){
  var R=[]; function t(n,c){R.push((c?'PASS ':'FAIL ')+n)}
  var $=function(i){return document.getElementById(i)};
  var wait=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
  var calls=[], queue=[];
  window.fetch=function(url,opts){ calls.push({url:url, body:JSON.parse(opts.body)}); var n=queue.shift(); return Promise.resolve({ok:n.status===200, status:n.status, json:function(){return Promise.resolve(n.body)}}); };
  try{
  t('28 objections', document.querySelectorAll('#olist .obtn').length===28);
  t('12 lessons', document.querySelectorAll('#lessonGrid .lesson').length===12);
  $('tab-roleplay').click();
  t('live panel shown (worker backend)', !$('rpLive').hidden && !$('rpPassRow').hidden && $('rpChecking').hidden && $('rpNoLive').hidden);
  t('speak toggle shown', !$('rpSpeakRow').hidden);
  t('manual prompt has rules', /FEEDBACK/.test($('rpOut').value) && /Start now with your opening line/.test($('rpOut').value));
  $('rpPass').value=''; $('rpStart').click();
  t('passcode required', /passcode first/.test($('rpLiveStatus').textContent) && calls.length===0);
  $('rpPass').value='trail-test';
  $('rpContext').value='<img src=x onerror=alert(1)> trades'; $('rpContext').dispatchEvent(new Event('input'));
  queue.push({status:200, body:{reply:"We already have a coach, honestly."}});
  $('rpStart').click(); await wait(50);
  t('opening line shown', document.querySelectorAll('#rpChat .msg.prospect').length===1 && /already have a coach/.test($('rpChat').textContent));
  t('request well-formed', calls[0].url.endsWith('/roleplay') && calls[0].body.passcode==='trail-test' && calls[0].body.turns.length===0 && /owner|CEO|founder|president/i.test(calls[0].body.persona) && calls[0].body.objection.length>5);
  t('compose shown, count', !$('rpCompose').hidden && /Reply 1 of 6/.test($('rpCount').textContent));
  t('settings locked', $('rpPersona').disabled && $('rpPass').disabled);
  $('rpSend').click(); t('empty reply blocked', /reply first/.test($('rpLiveStatus').textContent));
  queue.push({status:200, body:{reply:"Mostly strategy for me personally."}});
  $('rpInput').value="That makes sense. What does your coach help you with most?"; $('rpSend').click(); await wait(50);
  t('exchange appended', document.querySelectorAll('#rpChat .msg.you').length===1 && document.querySelectorAll('#rpChat .msg.prospect').length===2);
  t('turns sent alternate', calls[1].body.turns.length===2 && calls[1].body.turns[0].role==='assistant' && calls[1].body.turns[1].role==='user');
  t('count advanced', /Reply 2 of 6/.test($('rpCount').textContent));
  queue.push({status:401, body:{error:'bad_passcode'}});
  $('rpInput').value="Is it focused on you or the team?"; $('rpSend').click(); await wait(50);
  t('error restores input', /passcode didn/.test($('rpLiveStatus').textContent) && $('rpInput').value==="Is it focused on you or the team?" && document.querySelectorAll('#rpChat .msg.you').length===1);
  queue.push({status:200, body:{reply:"FEEDBACK\n1. Framed early: No.\n2. Acknowledged: Yes."}});
  $('rpEnd').click(); await wait(50);
  t('END sent', calls[3].body.turns[calls[3].body.turns.length-1].content==='END');
  t('feedback shown, compose hidden', document.querySelectorAll('#rpChat .msg.feedback').length===1 && /Framed early/.test($('rpChat').textContent) && !/^FEEDBACK/.test(document.querySelector('.msg.feedback .txt').textContent) && $('rpCompose').hidden && !$('rpReset').hidden);
  t('no injected img', document.querySelectorAll('img').length===1);
  $('rpReset').click();
  t('reset clears and unlocks', $('rpChat').children.length===0 && !$('rpStart').hidden && !$('rpPersona').disabled);
  t('passcode remembered', (function(){try{return localStorage.getItem('pinnacle-objection-lab-passcode')==='trail-test'}catch(e){return true}})());
  queue.push({status:503, body:{error:'busy'}}); $('rpStart').click(); await wait(50);
  t('start failure recovers', /didn.t answer/.test($('rpLiveStatus').textContent) && !$('rpStart').hidden && !$('rpPersona').disabled && $('rpChat').children.length===0);
  t('no horizontal overflow', document.documentElement.scrollWidth<=window.innerWidth);
  }catch(e){R.push('ERROR '+e.message+' '+e.stack)}
  var pre=document.createElement('pre'); pre.id='TEST'; pre.textContent=R.join('\n'); document.body.append(pre);
});
</script>
