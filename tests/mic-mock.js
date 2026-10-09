<script>
// Fake SpeechRecognition installed before the app script runs.
window.__recs=[];
window.webkitSpeechRecognition=function(){ var r=this; r.started=false; window.__recs.push(r);
  r.start=function(){ r.started=true; }; r.stop=function(){ r.started=false; setTimeout(function(){ r.onend&&r.onend(); },0); };
  r.say=function(texts){ var results=texts.map(function(t){ return Object.assign([{transcript:t}],{isFinal:true}); }); r.onresult&&r.onresult({resultIndex:0, results:results}); };
};
window.SpeechRecognition=window.webkitSpeechRecognition;
</script>
