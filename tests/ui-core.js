<script>
window.addEventListener('load', function(){
  var R=[]; function t(n,c){R.push((c?'PASS ':'FAIL ')+n)}
  var $=function(i){return document.getElementById(i)};
  try{
  t('28 objections listed', document.querySelectorAll('#olist .obtn').length===28);
  t('card renders 5 steps', document.querySelectorAll('#ocard .step').length===5);
  t('go deeper shown', document.querySelectorAll('#ocard .deeper li').length===2);
  var chips=document.querySelectorAll('#chips .chip'); t('9 chips', chips.length===9);
  chips[8].click();
  t('filter EOS same -> 3', document.querySelectorAll('#olist .obtn').length===3);
  t('card switched to visible item', /Pinnacle just EOS/.test($('ocard').textContent));
  chips[1].click(); t('money -> 2', document.querySelectorAll('#olist .obtn').length===2);
  chips[0].click();
  [...document.querySelectorAll('#olist .obtn')].find(b=>/didn.t stick/.test(b.textContent)).click();
  t('select didnt-stick', /didn.t stick/.test($('ocard .bigq')?$('ocard').textContent:$('ocard').textContent));
  $('tab-lessons').click(); t('lessons tab', !$('lessons').hidden && $('objections').hidden);
  t('12 lessons', document.querySelectorAll('#lessonGrid .lesson').length===12);
  t('5 legend items', document.querySelectorAll('.legend li').length===5);
  t('translator rows 13', document.querySelectorAll('#tbody tr').length===13);
  $('tab-objections').click();
  var btn=[...document.querySelectorAll('#ocard .btn')].find(b=>/Drill/.test(b.textContent)); btn.click();
  t('drill opened with objection', !$('drill').hidden && /didn.t stick/.test($('drillLine').textContent));
  $('drillCheck').click(); t('blank answer message', /Write what/.test($('drillStatus').textContent));
  $('drillAnswer').value="That's frustrating. Where did it start to slip? If you'd rather wait, that's a fair call.";
  $('drillCheck').click(); var fb=$('drillFeedback').textContent;
  t('good answer passes', /acknowledging them/.test(fb)&&/open question/.test(fb)&&/room for a no\./.test(fb)&&!/Mostly telling/.test(fb));
  $('drillAnswer').value="Pinnacle is different. EOS is rigid. You must switch. It costs $500. We tailor everything. Our guides are great. Do you want to?";
  $('drillCheck').click(); fb=$('drillFeedback').textContent;
  t('bad answer flags all', /knock on EOS/.test(fb)&&/pressure/.test(fb)&&/numbers/.test(fb)&&/yes or no/.test(fb)&&/Mostly telling/.test(fb)&&/opened with yourself/.test(fb));
  t('6 self-check items', document.querySelectorAll('#selfcheck input').length===6);
  $('drillReveal').click(); t('model shown with deeper', !$('drillModel').hidden && $('drillModel').querySelectorAll('.step').length===5 && $('drillModel').querySelectorAll('.deeper li').length===2);
  $('drillDone').click(); $('drillDone').click(); t('drilled counted once', /^1 of 28/.test($('drillProgress').textContent));
  $('drillPick').value='peers'; $('drillPick').dispatchEvent(new Event('change'));
  t('switch clears', $('drillAnswer').value===''&&$('drillFeedback').children.length===0&&$('drillModel').hidden);
  t('6 personas', $('rpPersona').options.length===6);
  $('rpContext').value='<img src=x onerror=alert(1)> trades'; $('rpContext').dispatchEvent(new Event('input'));
  t('prompt has context + rubric', /guide's own context: <img/.test($('rpOut').value) && /Rate the guide/.test($('rpOut').value));
  t('no injected img', document.querySelectorAll('img').length===1);
  $('tab-lessons').click();
  t('no horizontal overflow', document.documentElement.scrollWidth<=window.innerWidth);
  }catch(e){R.push('ERROR '+e.message)}
  var pre=document.createElement('pre'); pre.id='TEST'; pre.textContent=R.join('\n'); document.body.append(pre);
});
</script>
