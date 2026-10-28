/* ie.js - Internet Explorer (ids "ie" and "msn").
 * A browser-looking window around an <iframe>. Type an address and press Enter / Go.
 * Note: many sites (google.com, msn.com ...) refuse to be shown inside a frame; that is the site's choice.
 */
(function () {
  const IC = XP.icons.get;
  const { BACK, FWD, BACKD, FWDD, STOP, REF, HOME, tb: T } = XP.ui;

  /* The "Welcome to the Web" start page shown for about:home. */
  const STARTPG=`<!doctype html><meta charset=utf-8><style>body{margin:0;font:12px Tahoma,Verdana,sans-serif;background:#fff;color:#000}.h{background:linear-gradient(#3b6fd0,#1d4aa8);color:#fff;padding:14px 20px;font-size:22px;font-weight:bold}.h small{display:block;font-size:11px;font-weight:normal;opacity:.85}.c{padding:14px 20px}a{color:#0033cc;cursor:pointer;display:block;margin:4px 0}h4{margin:10px 0 4px;color:#1d4aa8}p{color:#666}</style><div class=h>Welcome to the Web<small>Internet Explorer start page</small></div><div class=c><h4>Try a page</h4><a data-u="https://en.wikipedia.org/wiki/Windows_XP">Windows XP - Wikipedia</a><a data-u="https://example.com/">example.com</a><a data-u="https://archive.org/">Internet Archive</a><p>Type an address above and press Enter. Some sites (msn.com, google.com...) refuse to be shown inside a frame.</p></div><script>document.onclick=e=>{const u=e.target.dataset&&e.target.dataset.u;if(u)parent.postMessage({go:u},'*')}<\/script>`;

  /* Back / Forward / history / loading status for one IE window. */
  function ieFrame(w,el,inp){
  const fr=el.querySelector(".pg iframe"),tb=[...el.querySelectorAll(".tbar .tbn")],st=el.querySelector(".sbar span"),h=[],o={i:-1};
  const fix=u=>{u=u.trim();if(!u)return"";if(/^about:|^https?:\/\//i.test(u))return u.replace(/^http:/i,"https:");return"https://"+u};
  const show=()=>{const u=h[o.i];if(u==="about:home")fr.srcdoc=STARTPG,fr.removeAttribute("src");else fr.removeAttribute("srcdoc"),fr.src=u;st.textContent="Opening page...";const bd=o.i<=0,fd=o.i>=h.length-1;tb[0].className="tbn"+(bd?" dis":"");tb[0].innerHTML=(bd?BACKD:BACK)+"<span>Back</span>";tb[2].className="tbn"+(fd?" dis":"");tb[2].innerHTML=fd?FWDD:FWD};
  const go=(u,add=!0)=>{u=fix(u);if(!u)return;if(add){h.splice(o.i+1);h.push(u);o.i=h.length-1}if(u!=="about:home"){inp.value=u.replace(/^https:\/\//,"http://");w.title=u.replace(/^https?:\/\//,"").replace(/\/$/,"")+" - Microsoft Internet Explorer";el.querySelector(".wt").textContent=w.title;w.btn.querySelector("span").textContent=w.title}show()};
  fr.onload=()=>st.textContent="Done";w.nav=u=>go(u);
  addEventListener("message",e=>{if(e.source===fr.contentWindow&&e.data&&e.data.go)go(e.data.go)});
  tb[0].onclick=()=>{if(o.i>0){o.i--;show()}};tb[2].onclick=()=>{if(o.i<h.length-1){o.i++;show()}};
  tb[3].onclick=()=>{try{fr.contentWindow.stop()}catch(e){}st.textContent="Done"};tb[4].onclick=show;tb[5].onclick=()=>go("about:home");
  tb[8].onclick=()=>XP.open("mail");tb[9].onclick=()=>XP.open("msg");
  go("about:home");
}

  /* Window body markup. k is the app id ("ie" or "msn"): MSN starts on msn.com's address. */
  const view = k => XP.ui.menubar() + `<div class="tbar">${T("Back",BACKD,"dis")}${T("",'<svg viewBox="0 0 8 8" style="width:8px"><path d="M1 2h6L4 6z" fill="#777"/></svg>',"dis")}${T("",FWDD,"dis")}${T("",STOP,"sm")}${T("",REF,"sm")}${T("",HOME,"sm")}<div class="tsep"></div>${T("Search",`<img src="${IC("search")}">`)}${T("Favorites",`<img src="${IC("fav")}">`)}<div class="tsep"></div>${T("",`<img src="${IC("mail")}">`,"sm")}${T("",`<img src="${IC("msg")}">`,"sm")}</div><div class="abar">Address<div class="inp"><img src="${IC("ie")}"><input value="${k==="msn"?"http://www.msn.com/":"http://www.microsoft.com/isapi/redir.dll?prd=ie&pver=6&ar=msnhome"}" spellcheck="false"></div><span class="go"><i></i>Go</span><span>Links»</span></div><div class="pg"><iframe title="Internet Explorer" allow="fullscreen"></iframe></div><div class="sbar"><img src="${IC("ie")}" width="16" height="16"><span>Done</span><div class="sp"><img src="${IC("ie")}" width="16" height="16"><span>Internet</span></div></div>`;

  const common = {
    multi: true,                 // every open() makes a new browser window
    size: { w: 624, h: 405 },
    content: w => view(w.key),
    onOpen(w) {
      const el = w.el, inp = el.querySelector(".abar input");
      const go = () => {
        const v = inp.value.trim();
        if (!v) return;
        w.nav && w.nav(v);
        w.setTitle(v.replace(/^https?:\/\//, "").replace(/\/$/, "") + " - Microsoft Internet Explorer");
      };
      inp.onkeydown = e => { if (e.key === "Enter") go(); };
      el.querySelector(".go").onclick = go;
      ieFrame(w, el, inp);
    }
  };

  XP.apps.register(Object.assign({ id: "ie",  title: "Welcome to MSN.com - Microsoft Internet Explorer", icon: "ie" },  common));
  XP.apps.register(Object.assign({ id: "msn", title: "MSN.com - Microsoft Internet Explorer",             icon: "msn" }, common));
})();
