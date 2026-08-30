(()=>{
  const key=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today=new Date();
  const core={name:'てすと',
    profile:{goal:'tone',days:'4',minutes:'20',activity:'some',level:'normal',noise:'quiet',timeOfDay:'night',area:['bellyLow'],stopReason:['busy'],avoid:['none'],tendency:['swell'],age:'30',height:'160',weight:'60',goalWeight:'52'},
    plan:null, weights:[], cheers:[], weekSeen:key(today),
    consent:{v:1,at:new Date().toISOString()}, health:[], badgeSeen:null,
    countdownOn:false   /* <-- countdown OFF */
  };
  localStorage.setItem('hometrain:core:v1',JSON.stringify(core));
  localStorage.setItem('hometrain:log:v1','{}');
  localStorage.setItem('hometrain:photos:v1','[]');
})();
