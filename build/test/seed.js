(()=>{
  const key=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today=new Date();
  const log={}, weights=[];
  for(let i=120;i>=0;i--){
    const d=new Date(today); d.setDate(d.getDate()-i);
    const dow=d.getDay();
    if([1,2,4,5].includes(dow)){
      log[key(d)]={ex:{squat:3,plank:2,march:5,walk:1,stretch:1},done:true,lv:2,stage:1,focus:'lower',feeling: i%7===0?'hard':(i%5===0?'easy':'ok')};
    } else if(dow===0 && i>0){
      log[key(d)]={ex:{stretch:1,march:5},done:true,lv:2,stage:1,focus:'rest'};
    }
    if(dow===0){ weights.push({date:key(d), kg: Math.round((60-(120-i)*0.02)*10)/10, waist:70, thigh:50}); }
  }
  const core={name:'てすと',profile:{goal:'tone',days:'4',minutes:'20',activity:'some',level:'normal',noise:'quiet',timeOfDay:'night',area:['bellyLow'],stopReason:['busy'],avoid:['none'],tendency:['swell'],age:'30',height:'160',weight:'60',goalWeight:'52'},plan:null,weights,cheers:['がんばれ'],weekSeen:'',consent:{v:1,at:new Date(Date.now()-121*864e5).toISOString()},health:[],badgeSeen:null};
  localStorage.setItem('hometrain:core:v1',JSON.stringify(core));
  localStorage.setItem('hometrain:log:v1',JSON.stringify(log));
  localStorage.setItem('hometrain:photos:v1',JSON.stringify([]));
})();
