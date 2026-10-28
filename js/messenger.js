/* messenger.js - Windows Messenger (id "msg") and its conversation windows (id "chat").
 * Contacts, sign-in and chat replies are all placeholders: nothing is sent anywhere.
 * To make the contact list / replies real, change the CT / REPLY arrays below.
 */
(function () {
  const MS=(()=>{
    const NAME=()=>XP.settings.userName;
    const E=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),Q=(e,s)=>e.querySelector(s),
    ST={online:["Online",0],busy:["Busy",1],brb:["Be Right Back",3],away:["Away",3],off:["Appear Offline",0]},
    CT=[["Alex","online","Working on something cool"],["Sam","online","listening to music"],["Casey","online",""],["Jordan","busy","In a meeting"],["Taylor","away","brb"],["Morgan","off",""],["Riley","off",""]],
    EM={":)":0,":-)":0,":D":1,":d":1,";)":2,";-)":2,":O":3,":o":3,":P":4,":p":4,"(H)":5,"(h)":5,":@":6,":$":7,":S":8,":s":8,":(":9,":-(":9,":'(":10,":|":11,"(6)":12,"(A)":13,"(a)":13,"(L)":14,"(l)":14,"(U)":15,"(u)":15,"(*)":20,"(E)":22,"(e)":22,"(F)":24,"(f)":24,"(K)":27,"(k)":27,"(G)":28,"(g)":28,"(^)":29,"(Y)":40,"(y)":40,"(N)":41,"(n)":41,"(R)":46,"(r)":46},
    ER=new RegExp(Object.keys(EM).map(k=>k.replace(/[()*^$|]/g,"\\$&")).join("|"),"g"),
    fmt=t=>E(t).replace(ER,m=>`<i class="em" style="background-position:-${EM[m]*19}px 0"></i>`),
    REPLY=["Hey! This is a placeholder chat, so I can only give canned answers :)","Real messaging isn't hooked up yet, but the window works!","Interesting... tell me more (this reply is pre-written).","LOL :D","brb, grabbing a snack (L)","Did you see that new wallpaper? Bliss forever.","I'm just a placeholder contact, but I'm listening.","Nice! (Y)","Hmm, let me think about that... :S","ttyl! (this is not a real person)"],
    now=()=>new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),
    ico=s=>`<i class="st${s==="off"?" off":""}" style="background-position:-${ST[s][1]*16}px 0"></i>`,
    menu=a=>`<div class="mb">${a.map(x=>`<span>${x}</span>`).join("")}</div>`;
    let signed=!1,mine="online";
    const html=k=>k==="chat"?menu(["File","Edit","Actions","Tools","Help"])+`<div class="ch"><div class="ch-to">To: <b></b></div><div class="ch-bd"><div class="ch-l"><div class="ch-tx"></div><div class="ch-em">${[0,1,2,3,4,9,14,40].map(i=>`<i data-i="${i}" class="em" style="background-position:-${i*19}px 0"></i>`).join("")}</div><div class="ch-in"><textarea spellcheck="false"></textarea><button class="msb">Send</button></div></div><div class="ch-r"><img class="cp" src="system/msn/buddy.png" alt=""><img src="system/msn/owner.png" alt=""></div></div><div class="ch-st"></div></div>`:
    menu(["File","Contacts","Actions","Tools","Help"])+`<div class="ms"><div class="ms-in"><img src="system/msn/logo.png" alt=""><h3>.NET Messenger Service</h3><label>E-mail address:<input type="text" value="owner@hotmail.com"></label><label>Password:<input type="password" value="********"></label><label class="chk"><input type="checkbox" checked>Sign me in automatically</label><button class="msb">Sign In</button></div><div class="ms-hd" hidden><img src="system/msn/owner.png" alt=""><div><b>${E(NAME())}</b><small>owner@hotmail.com</small><br><select>${Object.entries(ST).map(([v,s])=>`<option value="${v}">${s[0]}</option>`).join("")}<option value="out">Sign Out</option></select></div></div><div class="ms-ls" hidden></div><div class="ms-ft" hidden><span></span><span>MSN Messenger</span></div></div>`;
    function main(w){
      const el=w.el,$=s=>Q(el,s),inV=$(".ms-in"),hd=$(".ms-hd"),ls=$(".ms-ls"),ft=$(".ms-ft"),sel=$(".ms-hd select"),paint=()=>{
        const on=CT.filter(c=>c[1]!=="off"),of=CT.filter(c=>c[1]==="off"),row=c=>`<div class="ct ${c[1]==="off"?"off":""}" data-n="${c[0]}">${ico(c[1])}<span>${c[0]}</span><small>${c[2]?"- "+E(c[2]):""}</small></div>`;
        ls.innerHTML=`<h5>Online (${on.length})</h5>${on.map(row).join("")}<h5>Not Online (${of.length})</h5>${of.map(row).join("")}`;
        ft.firstChild.textContent=on.length+" contacts online";
        $(".ms-hd b").innerHTML=`${E(NAME())} <small>(${ST[mine][0]})</small>`};
      const show=on=>{signed=on;inV.hidden=on;hd.hidden=ft.hidden=ls.hidden=!on;if(on){sel.value=mine;paint()}};
      $(".ms-in .msb").onclick=()=>{const b=$(".ms-in .msb");b.disabled=!0;b.textContent="Signing in...";setTimeout(()=>{b.disabled=!1;b.textContent="Sign In";show(!0)},900)};
      sel.onchange=()=>{if(sel.value==="out")return show(!1);mine=sel.value;paint()};
      ls.onclick=e=>{const c=e.target.closest(".ct");if(!c)return;ls.querySelectorAll(".ct.sel").forEach(x=>x.classList.remove("sel"));c.classList.add("sel")};
      ls.ondblclick=e=>{const c=e.target.closest(".ct");if(c)chatWith(c.dataset.n)};
      if(signed)show(!0);
    }
    function chatWith(n){
      const ex=XP.windows.find(w=>w.chat===n);if(ex){if(ex.min)XP.windows.restore(ex);return XP.windows.focus(ex)}
      const c=CT.find(x=>x[0]===n);XP.open("chat",{title:n+" - Conversation",chat:n,c});
    }
    function chat(w,o){
      const el=w.el,n=o.chat,c=o.c,tx=Q(el,".ch-tx"),ta=Q(el,"textarea"),stt=Q(el,".ch-st");w.chat=n;
      Q(el,".ch-to b").textContent=`${n} <${n.toLowerCase()}@placeholder.net>`;
      if(c[1]==="off")Q(el,".cp").style.filter="grayscale(1)";
      const add=(cls,who,t)=>{const p=document.createElement("p");p.className=cls;p.innerHTML=who?`<span class="who">${E(who)} says:</span><br>&nbsp;${fmt(t)}`:E(t);tx.appendChild(p);tx.scrollTop=tx.scrollHeight};
      add("sys","",c[1]==="off"?`${n} appears offline. Messages here are placeholders only.`:"Placeholder chat: replies are pre-written and nothing is sent anywhere.");
      const send=()=>{const t=ta.value.trim();if(!t)return;ta.value="";add("me",NAME(),t);stt.textContent="Last message sent at "+now()+".";
        if(c[1]==="off"){add("sys","",`${n} is offline and will receive your message the next time they sign in (placeholder).`);return}
        clearTimeout(w.tm);setTimeout(()=>stt.textContent=n+" is typing a message.",500);
        w.tm=setTimeout(()=>{if(!el.isConnected)return;add("",n,REPLY[Math.random()*REPLY.length|0]);stt.textContent="Last message received at "+now()+"."},1600+Math.random()*1400)};
      Q(el,".ch-in .msb").onclick=send;
      ta.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
      el.querySelectorAll(".ch-em i").forEach(i=>i.onclick=()=>{ta.value+=Object.keys(EM).find(k=>EM[k]==i.dataset.i);ta.focus()});
      if(c[1]!=="off")setTimeout(()=>{if(el.isConnected){add("",n,"Hi "+NAME()+"! "+REPLY[0]);stt.textContent="Last message received at "+now()+"."}},900);
      setTimeout(()=>ta.focus(),50);
    }
    return{html,main,chat,chatWith};
  })();

  XP.apps.register({
    id: "msg",
    title: "Windows Messenger",
    icon: "msg",
    size: { w: 252, h: 460 },
    css: ["css/apps/messenger.css"],
    content: () => MS.html("msg"),
    onOpen: w => MS.main(w)
  });

  /* One window per conversation; opened by double-clicking a contact. Not shown on the desktop. */
  XP.apps.register({
    id: "chat",
    title: o => o.title,
    icon: "msg",
    multi: true,
    size: { w: 500, h: 390 },
    css: ["css/apps/messenger.css"],
    content: () => MS.html("chat"),
    onOpen: (w, o) => MS.chat(w, o)
  });
})();
