import OBR from "@owlbear-rodeo/sdk";
import { BSWhatsNewConstants } from "./bsWhatsNewConstants";

export let USER_REGISTERED = false;
export function GetWhatsNewButton()
{
    const EXTENSIONWHATSNEW = "com.battle-system.ticker-whatsnew";
    const newImgElement = document.createElement('img');
    newImgElement.id = "whatsNewButton";
    newImgElement.style.cursor = "pointer";
    newImgElement.setAttribute('class', 'icon');
    newImgElement.classList.add('clickable');
    newImgElement.setAttribute('title', 'Whats New?');
    newImgElement.setAttribute('src', '/w-info.svg');
    newImgElement.onclick = async function ()
    {
        await OBR.modal.open({
            id: EXTENSIONWHATSNEW,
            url: `/src/whatsnew/bswhatsnew.html?subscriber=${USER_REGISTERED}`,
            height: 500,
            width: 350,
        });
    };

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