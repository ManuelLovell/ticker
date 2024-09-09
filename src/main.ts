import OBR from "@owlbear-rodeo/sdk";
import * as Utilities from './utilities';
import { Constants } from './constants';
import { ITimeBomb } from './interfaces';
import { AlarmOBRBadge, ClearOBRBadge, SetTimerOBRBadge } from './tickerBadge';
import { CreateHourglass } from './tickerHourglass';
import { ConfigureMinuteSButton, ConfigurePauseButton, ConfigureResetButton, ConfigureStartButton, ConfigureTenSecondButton, ConfigureVisibleToggle, UpdateTimeDisplay } from './tickerButtons';
import { CheckRegistration, GetPatreonButton } from './patreonCheck/bsPatreon';
import './style.css'

class TickerTimer
{
    Started: boolean;
    Visible: boolean;

    Minutes: number; // time in minutes
    Seconds: number; // seconds counter
    Duration: number; // interval timer 1000 = 1 second
    TimeSet: number; // variable to handle time remaining
    TimerInterval: number;

    ZuluStartTime: string;
    ZuluEndTime: string;

    TargetEndTime: string;

    CurrentTheme: "LIGHT" | "DARK";
    CurrentRole: "PLAYER" | "GM";
    CurrentId: string;

    VisibleToggle: HTMLInputElement;
    VisibleLabel: HTMLLabelElement;

    TenMinuteButton: HTMLButtonElement;
    FiveMinuteButton: HTMLButtonElement;
    OneMinuteButton: HTMLButtonElement;
    TenSecondButton: HTMLButtonElement;

    StartButton: HTMLButtonElement;
    PauseButton: HTMLButtonElement;
    ResetButton: HTMLButtonElement;

    TimerArea: HTMLDivElement;

    ActiveArea: HTMLDivElement;
    InactiveArea: HTMLDivElement;

    Broadcast?: () => void;

    constructor()
    {
        this.Started = false;
        this.Visible = true;
        this.Minutes = 0;
        this.Seconds = 0;
        this.Duration = 1000; // interval timer 1000 = 1 second
        this.TimeSet = 0; // variable to handle time remaining
        this.TimerInterval = 9999;

        this.ZuluStartTime = '';
        this.ZuluEndTime = '';
        this.TargetEndTime = '';

        this.CurrentTheme = "DARK";
        this.CurrentRole = "GM";
        this.CurrentId = "";

        this.ActiveArea = document.getElementById("activeTimer") as HTMLDivElement;
        this.InactiveArea = document.getElementById("inactiveTimer") as HTMLDivElement;

        this.TimerArea = document.getElementById('timerArea') as HTMLDivElement;
        this.VisibleToggle = document.getElementById('visibleToggle') as HTMLInputElement;
        this.VisibleLabel = document.getElementById('visibleToggle') as HTMLLabelElement;

        this.TenMinuteButton = document.getElementById('tenMinButton') as HTMLButtonElement;
        this.FiveMinuteButton = document.getElementById('fiveMinButton') as HTMLButtonElement;
        this.OneMinuteButton = document.getElementById('oneMinButton') as HTMLButtonElement;
        this.TenSecondButton = document.getElementById('tenSecButton') as HTMLButtonElement;

        this.StartButton = document.getElementById('startButton') as HTMLButtonElement;
        this.PauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
        this.ResetButton = document.getElementById('resetButton') as HTMLButtonElement;
    }

    public async Initialize()
    {
        // Set theme accordingly
        this.CurrentTheme = (await OBR.theme.getTheme()).mode;
        Utilities.SetThemeMode(this.CurrentTheme, document);

        // Check Role
        this.CurrentRole = await OBR.player.getRole();
        this.CurrentId = await OBR.player.getId();
        // Get Setting
        const roomData = await OBR.room.getMetadata();
        this.Visible = roomData[`${Constants.EXTENSIONID}/visible`] as boolean ?? true;
    }

    public FindGMElements()
    {
        this.TimerArea = document.getElementById('timerArea') as HTMLDivElement;
        this.VisibleToggle = document.getElementById('visibleToggle') as HTMLInputElement;
        this.VisibleLabel = document.getElementById('visibleToggle') as HTMLLabelElement;

        this.TenMinuteButton = document.getElementById('tenMinButton') as HTMLButtonElement;
        this.FiveMinuteButton = document.getElementById('fiveMinButton') as HTMLButtonElement;
        this.OneMinuteButton = document.getElementById('oneMinButton') as HTMLButtonElement;
        this.TenSecondButton = document.getElementById('tenSecButton') as HTMLButtonElement;

        this.StartButton = document.getElementById('startButton') as HTMLButtonElement;
        this.PauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
        this.ResetButton = document.getElementById('resetButton') as HTMLButtonElement;

        const patreonContainer = document.getElementById("patreonContainer") as HTMLDivElement;
        patreonContainer.appendChild(GetPatreonButton());
    }

    public FindPlayerElements()
    {
        this.ActiveArea = document.getElementById("activeTimer") as HTMLDivElement;
        this.InactiveArea = document.getElementById("inactiveTimer") as HTMLDivElement;
    }

    public async LoadGM()
    {
        Constants.APPELEMENT.innerHTML = Constants.GMINTERFACE;
        await CheckRegistration();
        this.FindGMElements();
        await OBR.action.setHeight(240);

        ConfigureStartButton(this.StartButton);
        ConfigureResetButton(this.ResetButton);
        ConfigurePauseButton(this.PauseButton);
        ConfigureMinuteSButton(this.OneMinuteButton, 1);
        ConfigureMinuteSButton(this.FiveMinuteButton, 5);
        ConfigureMinuteSButton(this.TenMinuteButton, 10);
        ConfigureTenSecondButton(this.TenSecondButton);
        ConfigureVisibleToggle(this.VisibleToggle);

        this.Broadcast = OBR.broadcast.onMessage(Constants.BROADCASTID, async (data) =>
        {
            const dataPackage = data.data as any;
            const meta = dataPackage[`${Constants.EXTENSIONID}/metadata_timeritem`] as any;
            const timeData = meta?.TimeBomb as ITimeBomb;

            // Don't care about our own updates
            if (!timeData || timeData.ownerId === this.CurrentId) return;
            // Ignore backup calls if we're already going
            if (timeData.auxillary === true && TICKER.Started) return;

            if (timeData.startTime && timeData.endTime)
            {
                // Start Logic
                const start = new Date(timeData.startTime);
                const end = new Date(timeData.endTime);

                let targetDuration = end.getTime() - start.getTime();

                // If this is old or negative, get out
                if (targetDuration < 3) return;

                const durationSeconds = Math.round(targetDuration / 1000);
                const minutes = Math.floor(durationSeconds / 60);
                const seconds = durationSeconds - minutes * 60;

                TICKER.Minutes = minutes;
                TICKER.Seconds = seconds;

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

                    // Clear old timeout
                    if (!isNaN(TICKER.TimerInterval)) clearInterval(TICKER.TimerInterval);

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
                        }

                        // Update badge if multiple of 5 or if Time is up
                        if (TICKER.TimeSet % 5 === 0 && TICKER.TimerArea.innerText !== "Ding!")
                        {
                            await SetTimerOBRBadge(TICKER.TimerArea.innerText);
                        }
                        else if (TICKER.TimerArea.innerText === "Ding!")
                        {
                            await AlarmOBRBadge();

                            // Clear old timeout
                            if (!isNaN(TICKER.TimerInterval)) clearInterval(TICKER.TimerInterval);

                            setTimeout(() =>
                            {
                                TICKER.ResetButton.click();
                            }, 2000); // 10000 milliseconds = 10 seconds
                        }
                    }, TICKER.Duration);
                }
            }
            // Pause Logic
            if (timeData.start === false && timeData.reset === false && TICKER.Started === true)
            {
                clearInterval(TICKER.TimerInterval);
                TICKER.StartButton.disabled = false;
                TICKER.PauseButton.disabled = true;
                TICKER.ResetButton.disabled = false;
                TICKER.Started = false;
                await SetTimerOBRBadge("Paused..");
            }

            // Reset Logic
            if (timeData.reset === true && timeData.start === false && TICKER.Started === false)
            {
                // Clear old timeout
                if (!isNaN(TICKER.TimerInterval)) clearInterval(TICKER.TimerInterval);

                TICKER.TimerArea.innerText = "0:00";
                TICKER.StartButton.disabled = false;
                TICKER.PauseButton.disabled = true;

                TICKER.Started = false;
                TICKER.Minutes = 0;
                TICKER.Seconds = 0;
                TICKER.TimeSet = 0;
                await ClearOBRBadge();
            }
        });
    }

    public async LoadPlayer()
    {
        Constants.APPELEMENT.innerHTML = Constants.TEMPPLAYERFACE;
        this.FindPlayerElements();
        await OBR.action.setHeight(75);

        this.ActiveArea.style.display = this.Visible ? 'flex' : 'none';
        this.InactiveArea.style.display = !this.Visible ? 'block' : 'none';


        this.Broadcast = OBR.broadcast.onMessage(Constants.BROADCASTID, async (data) =>
        {
            const dataPackage = data.data as any;
            const meta = dataPackage[`${Constants.EXTENSIONID}/metadata_timeritem`] as any;
            const timeData = meta?.TimeBomb as ITimeBomb;

            if (!timeData) return;
            if (timeData.auxillary === true && TICKER.Started) return;

            // Find new timers and start the countdown.
            if (timeData.startTime && timeData.endTime && timeData.endTime != TICKER.TargetEndTime && timeData.start === true)
            {
                TICKER.TargetEndTime = timeData.endTime;

                const start = new Date(timeData.startTime);
                const end = new Date(timeData.endTime);

                let targetDuration = end.getTime() - start.getTime();

                // If this is old or negative, get out
                if (targetDuration < 3) return;

                let durationSeconds = Math.round(targetDuration / 1000);

                //Create Hourglass
                this.ActiveArea.innerHTML = CreateHourglass(durationSeconds + "s");

                const timerArea = document.getElementById("timerNumbers")!;

                // Clear old timeout
                if (!isNaN(TICKER.TimerInterval)) clearInterval(TICKER.TimerInterval);

                //Set Timer Numbers
                TICKER.TimerInterval = setInterval(async function ()
                {
                    let minutes = Math.floor(durationSeconds / 60);
                    let seconds = durationSeconds - minutes * 60;

                    durationSeconds--;
                    seconds--;
                    if (seconds <= -1)
                    {
                        minutes--;
                        seconds = 60 - 1;
                    }
                    if (seconds < 10)
                    {
                        timerArea.innerText = `${minutes}:0${seconds}`;
                    } else
                    {
                        timerArea.innerText = `${minutes}:${seconds}`;
                    }

                    if (durationSeconds <= 0)
                    {
                        clearInterval(TICKER.TimerInterval);
                        //update buttons and Timer Area
                        timerArea.innerText = "Ding!";
                        //snd.play();  Can't play unless they interact with panel
                    }

                    // Update badge if multiple of 5 or if Time is up
                    if (durationSeconds % 5 === 0 && timerArea.innerText !== "Ding!")
                    {
                        TICKER.ActiveArea.style.display === "flex" ? await SetTimerOBRBadge(timerArea.innerText) : await SetTimerOBRBadge("Tick tock..");
                    }
                    else if (timerArea.innerText === "Ding!")
                    {

                        // Clear old timeout
                        if (!isNaN(TICKER.TimerInterval)) clearInterval(TICKER.TimerInterval);
                        await AlarmOBRBadge();
                    }
                    TICKER.UpdateNonVisibleMessage(durationSeconds > 0);
                    TICKER.Started = durationSeconds > 0;


                }, TICKER.Duration);
            }

            if (timeData.start == false && timeData.reset == false && TICKER.TargetEndTime !== undefined)
            {
                const timeLeft = document.getElementById("timerNumbers")!.innerText;
                this.ActiveArea.innerHTML = `
                    <div class="timerPaused">⏳ ${timeLeft} ⌛</div>`;
                this.InactiveArea.innerText = 'Paused..';
                clearInterval(TICKER.TimerInterval);
                await SetTimerOBRBadge("Paused..");
            }

            if (timeData.reset == true && TICKER.TargetEndTime !== undefined)
            {
                this.ActiveArea.innerHTML = `
                    <div class="timerNumbers">⏳...</div>`;
                this.UpdateNonVisibleMessage(false);
                clearInterval(TICKER.TimerInterval);
                await ClearOBRBadge();
            }
        });

        this.ActiveArea.innerHTML = `
        <div class="timerNumbers">⏳...</div>`;
    }

    public UpdateNonVisibleMessage(running: boolean)
    {
        this.InactiveArea.innerText = running ? "Time is running out.." : "Not Running";
    }

    public async StartListeners()
    {
        OBR.theme.onChange((theme) =>
        {
            this.CurrentTheme = theme.mode;
            Utilities.SetThemeMode(theme.mode, document);
        });

        OBR.player.onChange((player) =>
        {
            if (player.role !== this.CurrentRole)
            {
                this.Broadcast!();
                this.CurrentRole = player.role;
                if (this.CurrentRole === "GM") this.LoadGM();
                else this.LoadPlayer();
            }
        });

        OBR.room.onMetadataChange((metadata) =>
        {
            const tickerItem = metadata[`${Constants.EXTENSIONID}/visible`] as boolean ?? true;
            this.Visible = tickerItem;

            if (this.CurrentRole === "PLAYER")
            {
                this.ActiveArea.style.display = this.Visible ? 'flex' : 'none';
                this.InactiveArea.style.display = !this.Visible ? 'block' : 'none';;
            }
            else
            {
                this.VisibleToggle.checked = this.Visible;
            }
        });

        // Reset the badge if the window is open
        OBR.action.onOpenChange(async (open) =>
        {
            if (open)
            {
                await OBR.action.setBadgeText(undefined);
                await OBR.action.setBadgeBackgroundColor("#BB99FF");
                await OBR.action.setIcon("/icon.svg");
            }
        });
    }
}

export const TICKER = new TickerTimer();
await OBR.onReady(async () =>
{
    await TICKER.Initialize();
    await TICKER.StartListeners();
    if (TICKER.CurrentRole === "GM")
    {
        await TICKER.LoadGM();
    }
    else
    {
        await TICKER.LoadPlayer();
    }
});
