import{O as o}from"./index-08366f59.js";const c="com.battle-system.ticker-whatsnew",i=document.querySelector("#bs-whatsnew"),d=document.querySelector("#bs-whatsnew-notes");i.innerHTML=`
  <div id="newsContainer">
    <h1>Ticker! 5/1</h1>
    Annual clean-up and such. This one was a rush job for some people early on, and I just never came back cause.. it worked.
    </br> So cleaned things up a bit today. Wanted the footprint smaller, and less buttons.
    </br> The 'minus' buttons are now right-click/long press on the regular buttons.
    </br>
    </br> Added some stability in terms of the counter not going away for your players if they refresh.
    </br> Also added support for multiple GMs.  Why? I don't know. Just wanted this as feature complete as possible.
  </div>
`;o.onReady(async()=>{const n=window.location.search,e=new URLSearchParams(n).get("subscriber")==="true";d.innerHTML=`
        <div id="footButtonContainer">
            <button id="discordButton" type="button" title="Join the Owlbear-Rodeo Discord"><embed class="svg discord" src="/w-discord.svg" /></button>
            <button id="patreonButton" type="button" ${e?'title="Thank you for subscribing!"':'title="Check out the Battle-System Patreon"'}>
            ${e?'<embed id="patreonLogo" class="svg thankyou" src="/w-thankyou.svg" />':'<embed id="patreonLogo" class="svg patreon" src="/w-patreon.png" />'}</button>
        </div>
        <button id="closeButton" type="button" title="Close this window"><embed class="svg close" src="/w-close.svg" /></button>
        `;const s=document.getElementById("closeButton");s.onclick=async()=>{await o.modal.close(c)};const r=document.getElementById("discordButton");r.onclick=async t=>{t.preventDefault(),window.open("https://discord.gg/ANZKDmWzr6","_blank")};const a=document.getElementById("patreonButton");a.onclick=async t=>{t.preventDefault(),window.open("https://www.patreon.com/battlesystem","_blank")}});
