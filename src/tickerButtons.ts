import OBR from "@owlbear-rodeo/sdk";
import { ITimeBomb } from "./interfaces";
import { TICKER } from "./main";
import { Constants } from "./constants";
import { AlarmOBRBadge, ClearOBRBadge, SetTimerOBRBadge } from "./tickerBadge";

export function ConfigureStartButton(element: HTMLButtonElement)
{
    element.onclick = async function ()
    {
        if (element.disabled) return;

        if (TICKER.Minutes === 0 && TICKER.Seconds > 0)
        {
            TICKER.TimeSet = TICKER.Seconds; //set countdown to total seconds
        }
        else if (TICKER.Minutes > 0 && TICKER.Seconds === 0)
        {
            TICKER.TimeSet = TICKER.Minutes * 60; //set countdown to total seconds
        }
        else
        {
            TICKER.TimeSet = (TICKER.Minutes * 60) + TICKER.Seconds; //set countdown to total seconds
        }

        if (TICKER.TimeSet > 0 && TICKER.Started !== true)
        {
            TICKER.Started = true;
            TICKER.StartButton.disabled = true;
            TICKER.PauseButton.disabled = false;
            TICKER.ResetButton.disabled = true;
            TICKER.TimerInterval = setInterval(async function ()
            {
                TICKER.TimeSet--;
                TICKER.Seconds--;
                if (TICKER.Seconds <= -1)
                {
                    TICKER.Minutes--;
                    TICKER.Seconds = 60 - 1;
                }
                UpdateTimeDisplay(false);

                if (TICKER.TimeSet <= 0)
                {
                    clearInterval(TICKER.TimerInterval);
                    //update buttons and Timer Area
                    TICKER.TimerArea.innerText = "Ding!";
                    TICKER.StartButton.disabled = true;
                    TICKER.PauseButton.disabled = true;
                    TICKER.ResetButton.disabled = false;
                    snd.play();
                }

                // Update badge if multiple of 5 or if Time is up
                if (TICKER.TimeSet % 5 === 0 && TICKER.TimerArea.innerText !== "Ding!")
                {
                    await SetTimerOBRBadge(TICKER.TimerArea.innerText);
                    await SendTime(true);
                }
                else if (TICKER.TimerArea.innerText === "Ding!")
                {
                    await AlarmOBRBadge();
                    setTimeout(() =>
                    {
                        TICKER.ResetButton.click();
                    }, 2000); // 10000 milliseconds = 10 seconds
                }
            }, TICKER.Duration);
            await SendTime();
        }
    };
}

export function ConfigureResetButton(element: HTMLButtonElement)
{
    element.onclick = async function ()
    {
        if (element.disabled) return;
        TICKER.TimerArea.innerText = "0:00";
        TICKER.StartButton.disabled = false;
        TICKER.PauseButton.disabled = true;

        TICKER.Started = false;
        TICKER.Minutes = 0;
        TICKER.Seconds = 0;
        TICKER.TimeSet = 0;

        // Send to OBR to sync player timers
        let TimeBomb: ITimeBomb = {
            reset: true,
            start: false,
            visible: TICKER.Visible,
            ownerId: TICKER.CurrentId
        };

        let timerMeta: any = {};
        timerMeta[`${Constants.EXTENSIONID}/metadata_timeritem`] = { TimeBomb };
        await OBR.broadcast.sendMessage(Constants.BROADCASTID, timerMeta);
        await ClearOBRBadge();
    };
}

export function ConfigurePauseButton(element: HTMLButtonElement)
{
    element.onclick = async function ()
    {
        if (!TICKER.Started || element.disabled) return;

        clearInterval(TICKER.TimerInterval);
        TICKER.StartButton.disabled = false;
        TICKER.PauseButton.disabled = true;
        TICKER.ResetButton.disabled = false;
        TICKER.Started = false;

        // Send to OBR to sync player timers
        let TimeBomb: ITimeBomb = {
            start: false,
            reset: false,
            visible: TICKER.Visible,
            ownerId: TICKER.CurrentId
        };

        let timerMeta: any = {};
        timerMeta[`${Constants.EXTENSIONID}/metadata_timeritem`] = { TimeBomb };
        await OBR.broadcast.sendMessage(Constants.BROADCASTID, timerMeta);
        await SetTimerOBRBadge("Paused..");
    };
}

export function ConfigureVisibleToggle(element: HTMLInputElement)
{
    element.checked = TICKER.Visible;
    element.onchange = async function ()
    {
        TICKER.Visible = TICKER.VisibleToggle.checked;
        TICKER.VisibleLabel.innerText = TICKER.Visible ? "Visible" : "Hidden";

        await OBR.room.setMetadata({ [`${Constants.EXTENSIONID}/visible`]: TICKER.Visible });
    };
}
export function ConfigureMinuteSButton(element: HTMLButtonElement, length: 1 | 5 | 10): void
{
    element.onclick = async function ()
    {
        TICKER.Minutes += length;
        if (TICKER.Started)
        {
            TICKER.TimeSet += length * 60;
            await SendTime();
        }
        UpdateTimeDisplay(true);
    }
    element.oncontextmenu = async function (e)
    {
        e.preventDefault();
        if (TICKER.Minutes < length) return;
        TICKER.Minutes -= length;
        if (TICKER.Started)
        {
            TICKER.TimeSet -= length * 60;
            await SendTime();
        }
        UpdateTimeDisplay(false);
    }
}

export function ConfigureTenSecondButton(element: HTMLButtonElement): void
{
    element.onclick = async function ()
    {
        TICKER.Seconds += 10;
        if (TICKER.Started)
        {
            TICKER.TimeSet += 10;
            await SendTime();
        }
        if (TICKER.Seconds >= 60)
        {
            TICKER.Seconds = TICKER.Seconds - 60;
            TICKER.Minutes += 1;
        }
        UpdateTimeDisplay(true);
    };

    element.oncontextmenu = async function (e)
    {
        e.preventDefault();
        if (TICKER.Seconds < 11 && TICKER.Minutes === 0) return;

        TICKER.Seconds -= 10;
        if (TICKER.Started)
        {
            TICKER.TimeSet -= 10;
            await SendTime();
        }
        if (TICKER.Seconds <= 0)
        {
            TICKER.Seconds = TICKER.Seconds + 60;
            TICKER.Minutes -= 1;
        }
        UpdateTimeDisplay(false);
    };
}

export function UpdateTimeDisplay(adding: boolean)
{
    if (TICKER.Seconds == 0 || (TICKER.Seconds < 10 && !adding))
    {
        TICKER.TimerArea.innerText = `${TICKER.Minutes}:0${TICKER.Seconds}`;
    }
    else
    {
        TICKER.TimerArea.innerText = `${TICKER.Minutes}:${TICKER.Seconds}`;
    }
}

async function SendTime(auxTimer?: boolean)
{
    // Instead of sending an ending time (in case computers aren't synched) we send a start/end time and let the receiver calculate the difference
    // If we sent just the duration, it gets a little harder to tell when an updates happens. Ie; I originally have a 60 sec timer. 30 seconds go, and I send another 60 sec to reset it.
    // Because the numbers match, it won't get update.d
    // We get around this by sending unique time codes, but we only care about the difference. But it allows us to tell if it's a new timer or not easily.
    TICKER.ZuluStartTime = new Date(Date.now()).toISOString();
    TICKER.ZuluEndTime = new Date(Date.now() + (TICKER.TimeSet * 1000)).toISOString();

    // Send to OBR to sync player timers
    let TimeBomb: ITimeBomb = {
        startTime: TICKER.ZuluStartTime,
        endTime: TICKER.ZuluEndTime,
        start: true,
        reset: false,
        visible: TICKER.Visible,
        ownerId: TICKER.CurrentId,
        auxillary: auxTimer
    };

    let timerMeta: any = {};
    timerMeta[`${Constants.EXTENSIONID}/metadata_timeritem`] = { TimeBomb };
    await OBR.broadcast.sendMessage(Constants.BROADCASTID, timerMeta);

}

const snd = new Audio(Constants.DING);