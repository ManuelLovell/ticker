import OBR from "@owlbear-rodeo/sdk";
import '/src/whatsnew/new-style.css'

const EXTENSIONWHATSNEW = "com.battle-system.ticker-whatsnew";
const whatsnew = document.querySelector<HTMLDivElement>('#bs-whatsnew')!;
const footer = document.querySelector<HTMLElement>('#bs-whatsnew-notes')!;

whatsnew.innerHTML = `
  <div id="newsContainer">
    <h1>Ticker! 8/19</h1>
    Fixed a bug regarding synchronization on the player end. (Thank you @chris_stargazer for the report)
    <h1>Ticker! 5/1</h1>
    Annual clean-up and such. This one was a rush job for some people early on, and I just never came back cause.. it worked.
    </br> So cleaned things up a bit today. Wanted the footprint smaller, and less buttons.
    </br> The 'minus' buttons are now right-click/long press on the regular buttons.
    </br>
    </br> Added some stability in terms of the counter not going away for your players if they refresh.
    </br> Also added support for multiple GMs.  Why? I don't know. Just wanted this as feature complete as possible.
  </div>
`;

OBR.onReady(async () =>
{
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const subscriberId = urlParams.get('subscriber')!;
    const subscriber = subscriberId === "true";

    footer.innerHTML = `
        <div id="footButtonContainer">
            <button id="discordButton" type="button" title="Join the Owlbear-Rodeo Discord"><embed class="svg discord" src="/w-discord.svg" /></button>
            <button id="patreonButton" type="button" ${subscriber ? 'title="Thank you for subscribing!"' : 'title="Check out the Battle-System Patreon"'}>
            ${subscriber ? '<embed id="patreonLogo" class="svg thankyou" src="/w-thankyou.svg" />'
            : '<embed id="patreonLogo" class="svg patreon" src="/w-patreon.png" />'}</button>
        </div>
        <button id="closeButton" type="button" title="Close this window"><embed class="svg close" src="/w-close.svg" /></button>
        `;

    const closebutton = document.getElementById('closeButton');
    closebutton!.onclick = async () =>
    {
        await OBR.modal.close(EXTENSIONWHATSNEW);
    };

    const discordButton = document.getElementById('discordButton');
    discordButton!.onclick = async (e) =>
    {
        e.preventDefault();
        window.open("https://discord.gg/ANZKDmWzr6", "_blank");
    };

    const patreonButton = document.getElementById('patreonButton');
    patreonButton!.onclick = async (e) =>
    {
        e.preventDefault();
        window.open("https://www.patreon.com/battlesystem", "_blank");
    };
});
