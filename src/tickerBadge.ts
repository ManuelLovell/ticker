import OBR from "@owlbear-rodeo/sdk";
import { TICKER } from "./main";

export async function ClearOBRBadge()
{
    await OBR.action.setBadgeText(undefined);
    await OBR.action.setBadgeBackgroundColor("#BB99FF");
}

export async function SetTimerOBRBadge(text: string)
{
    const isOpen = await OBR.action.isOpen();
    if (!isOpen)
    {
        await OBR.action.setBadgeText(text);
        const badgeColor = TICKER.CurrentTheme === "DARK" ? "yellow" : "#159cc5";
        await OBR.action.setBadgeBackgroundColor(badgeColor);
    }

}

export async function AlarmOBRBadge()
{
    const isOpen = await OBR.action.isOpen();
    if (!isOpen)
    {
        await OBR.action.setBadgeText("Time's Up!");
        await OBR.action.setBadgeBackgroundColor("red");
    }
}