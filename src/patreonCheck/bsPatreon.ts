import OBR from "@owlbear-rodeo/sdk";
import { BSWhatsNewConstants } from "./bsPatreonConstants";

export let USER_REGISTERED = false;

export function GetPatreonButton()
{
    const newImgElement = document.createElement('img');
    newImgElement.id = "PatreonButton";
    newImgElement.setAttribute('class', 'icon');
    newImgElement.classList.add('clickable');
    newImgElement.setAttribute('title', USER_REGISTERED ? 'Thanks for subscribing!' : 'Get the news on updates on the Battle-System Patreon');
    newImgElement.setAttribute('src', USER_REGISTERED ? 'w-thankyou.svg' : '/w-patreon-2.png');
    newImgElement.onclick = async function (e)
    {
        e.preventDefault();
        window.open("https://www.patreon.com/battlesystem", "_blank");
    }

    return newImgElement;
}

export async function CheckRegistration()
{
    const owlbearId = await OBR.player.getId();
    try
    {
        const debug = window.location.origin.includes("localhost") ? "eternaldream" : "";
        const userid = {
            owlbearid: owlbearId
        };

        const requestOptions = {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json",
                "Authorization": BSWhatsNewConstants.ANONAUTH,
                "x-manuel": debug
            }),
            body: JSON.stringify(userid),
        };
        const response = await fetch(BSWhatsNewConstants.CHECKREGISTRATION, requestOptions);

        if (!response.ok)
        {
            const errorData = await response.json();
            // Handle error data
            console.error("Error:", errorData);
            return;
        }
        const data = await response.json();
        if (data.Data === "OK")
        {
            USER_REGISTERED = true;
        }
        else console.log("Not Registered");
    }
    catch (error)
    {
        // Handle errors
        console.error("Error:", error);
    }
}