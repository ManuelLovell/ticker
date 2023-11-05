import OBR, { Metadata } from '@owlbear-rodeo/sdk';
import * as Utilities from './utilities';
import './style.css'
import { Constants } from './constants';
import { ITimeBomb } from './interfaces';

let sceneReady = false;
let currentTheme: "LIGHT" | "DARK";
// Base loading until OBR is ready
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class=main><div id="timerArea">Loading..</div></div>`;

await OBR.onReady(async () =>
{
    // Set theme accordingly
    const theme = await OBR.theme.getTheme();
    currentTheme = theme.mode;
    sceneReady = await OBR.scene.isReady();

    Utilities.SetThemeMode(theme, document);
    OBR.theme.onChange((theme) =>
    {
        currentTheme = theme.mode;
        Utilities.SetThemeMode(theme, document);
    })

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

    // Get role
    const role = await OBR.player.getRole();
    if (role === "GM")
    {
        if (sceneReady)
        {
            SetupGMView();
        }
        else
        {
            document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
            <div class=main><div id="timerArea" class="disabled">Disabled until Scene Ready..</div></div>`;
        }

        OBR.scene.onReadyChange((ready) =>
        {
            if (ready)
            {
                SetupGMView();
            }
            else
            {
                document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
                <div class=main><div id="timerArea" class="disabled">Disabled until Scene Ready..</div></div>`;
            }
        });
    }
    else
    {
        SetupPlayerView();
    }
});

function SetupPlayerView(): void
{
    const timerDuration = 1000;
    let targetEndTime: string;
    let timerInterval: number;
    document.querySelector<HTMLDivElement>('#app')!.innerHTML =
    `<div id="activeTimer"></div>
    <div id="inactiveTimer" class="timerHidden"></div>`
    const activeArea = document.getElementById("activeTimer")!;
    const inactiveArea = document.getElementById("inactiveTimer")!;

    OBR.scene.onMetadataChange(async (metadata) =>
    {
        const meta = metadata[`${Constants.EXTENSIONID}/metadata_timeritem`] as any;
        const timeData = meta?.TimeBomb as ITimeBomb;

        if (!timeData) return;

        if (timeData.visible === false)
        {
            activeArea.hidden = true;
            inactiveArea.innerHTML = `Time is running out..`;
        }
        if (timeData.visible === true)
        {
            inactiveArea.innerHTML = ``;
            activeArea.hidden = false;
        }

        // Find new timers and start the countdown.
        if (timeData.startTime && timeData.endTime && timeData.endTime != targetEndTime && timeData.start === true)
        {
            targetEndTime = timeData.endTime;

            const start = new Date(timeData.startTime);
            const end = new Date(timeData.endTime);

            let targetDuration = end.getTime() - start.getTime();

            // If this is old or negative, get out
            if (targetDuration < 3) return;

            let durationSeconds = Math.round(targetDuration / 1000);

            //Create Hourglass
            activeArea.innerHTML = CreateHourglass(durationSeconds + "s");

            const timerArea = document.getElementById("timerNumbers")!;
            //Set Timer Numbers
            timerInterval = setInterval(async function ()
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
                    clearInterval(timerInterval);
                    //update buttons and Timer Area
                    timerArea.innerText = "Ding!";
                    //snd.play();  Can't play unless they interact with panel
                }

                // Update badge if multiple of 5 or if Time is up
                if (durationSeconds % 5 === 0 && timerArea.innerText !== "Ding!")
                {
                    activeArea.hidden === false? await SetTimerOBRBadge(timerArea.innerText) : await SetTimerOBRBadge("Tick tock..");
                }
                else if (timerArea.innerText === "Ding!")
                {
                    await AlarmOBRBadge();
                }

            }, timerDuration);
        }

        if (timeData.start == false && timeData.reset == false && targetEndTime !== undefined)
        {
            const timeLeft = document.getElementById("timerNumbers")!.innerText;
            activeArea.innerHTML = `
                <div class="timerPaused">⏳ ${timeLeft} ⌛</div>
                <div class="container-glass">
                </div>`;
            clearInterval(timerInterval);
            await SetTimerOBRBadge("Paused..");
        }

        if (timeData.reset == true && targetEndTime !== undefined)
        {
            activeArea.innerHTML = `
                <div class="timerNumbers">⏳...</div>
                <div class="container-glass">
                </div>`;
            clearInterval(timerInterval);
            await ClearOBRBadge();
        }
    });

    activeArea.innerHTML = `
    <div class="timerNumbers">⏳...</div>
    <div class="container-glass">
    </div>`;

}

function CreateHourglass(duration: string): string
{
    return `<div class="timerNumbers" id="timerNumbers">0:00</div>
    <div class="container-glass">
    <div class="glass"></div>
    <div class="get-hourglass">
    <svg width="140px" height="150px" viewBox="0 0 14 18">
    <defs>
    </defs>
    <g id="sandclock" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
        <path d="M13.0986667,16.465 L12.7226667,16.465 C12.6796667,16.031 12.5996667,15.6073333 12.4886667,15.1963333 C12.084,13.6953333 11.269,12.3646667 10.352,11.3396667 C9.52833333,10.4183333 8.623,9.74333333 7.859,9.41433333 C7.859,9.41433333 7.56766667,9.20133333 7.56766667,8.97866667 C7.56766667,8.75633333 7.859,8.54533333 7.859,8.54533333 C9.687,7.74033333 12.3786667,4.93333333 12.7223333,1.50133333 L13.0986667,1.50133333 C13.5006667,1.50133333 13.8266667,1.17533333 13.8266667,0.773666667 C13.8266667,0.371666667 13.5006667,0.0456666667 13.0986667,0.0456666667 L0.776,0.0456666667 C0.374,0.0456666667 0.048,0.371666667 0.048,0.773666667 C0.048,1.17533333 0.374,1.50133333 0.776,1.50133333 L1.152,1.50133333 C1.49233333,4.93666667 4.15866667,7.745 6.00533333,8.54733333 C6.00533333,8.54733333 6.31133333,8.737 6.31133333,8.97866667 C6.31133333,9.22033333 6.01566667,9.421 6.01566667,9.421 C5.26233333,9.75266667 4.36333333,10.4246667 3.54166667,11.3396667 C2.62066667,12.3646667 1.79833333,13.6953333 1.389,15.1963333 C1.277,15.6073333 1.196,16.031 1.15266667,16.465 L0.776,16.465 C0.374,16.465 0.048,16.791 0.048,17.1926667 C0.048,17.5946667 0.374,17.9206667 0.776,17.9206667 L13.0986667,17.9206667 C13.5006667,17.9206667 13.8266667,17.5946667 13.8266667,17.1926667 C13.8263333,16.791 13.5006667,16.465 13.0986667,16.465 L13.0986667,16.465 Z M2.47033333,16.4923333 L1.892,16.4923333 C1.92166667,16.023 1.97666667,15.5933333 2.053,15.1963333 C2.273,14.054 2.67366667,13.1896667 3.18666667,12.4753333 C3.47733333,12.0703333 3.80133333,11.6873333 4.14033333,11.3396667 C4.80733333,10.6553333 5.88879069,10.1021427 6.19133333,9.82066667 C6.49387598,9.53919067 6.65833333,9.39266667 6.65833333,8.997 C6.65833333,8.60133333 6.45611593,8.47363293 6.03570577,8.2112428 C5.61529562,7.94885266 4.034,6.69966667 3.17433333,5.49566667 C2.488,4.53433333 2.00533333,3.328 1.891,1.50166667 L11.982,1.50166667 C11.8663333,3.322 11.378,4.52866667 10.687,5.49133333 C9.82466667,6.69266667 8.52740499,7.75976575 7.89733907,8.12268078 C7.26727316,8.48559582 7.22133333,8.61 7.22133333,8.98333333 C7.22133333,9.35666667 7.41784912,9.52330154 7.89733907,9.82066691 C8.37682903,10.1180323 9.08133333,10.6486667 9.75266667,11.3393333 C10.0873333,11.6833333 10.4066667,12.0626667 10.6933333,12.4633333 C11.2053333,13.179 11.6043333,14.0463333 11.823,15.196 C11.8983333,15.5926667 11.9523333,16.0223333 11.9816667,16.492 L11.4053333,16.492 C4.14033338,16.4920002 5.86059567,16.4920002 2.47033333,16.4923333 Z" id="Shape" fill="transparent"></path>
			
	<g id="sand">
        <path d="M7.00695799,10.3484497 C7.00695799,10.3484497 6.27532958,10.4129639 7.00695799,10.3484497 C7.73858641,10.2839355 7.00695799,10.3484497 7.00695799,10.3484497 C7.00695799,10.3484497 7.78173827,9.99768063 7.09265135,10.548584 C6.40356444,11.0994873 7.09265137,10.548584 7.09265137,10.548584 L7.09265137,10.5493774 L11.4924319,16.4705197 L2.52148436,16.4705197 L6.87243652,10.5493774 L6.80957031,10.548584 C6.80957031,10.548584 7.1925659,10.737854 6.87243651,10.548584 C6.37234656,10.2529159 7.00695799,10.3484497 7.00695799,10.3484497 Z" id="Path-26" fill="#C62626" sketch:type="MSShapeGroup">
                                
                <animate 
                            attributeName="d" 
                dur=${duration} 
                repeatCount="once"
                keyTimes="0;
                        .01;
                        .2;
                        .4;
                        .7;
                        .8;
                        .99;
                        1"
                        
                values="M2.33630371,3.07006836 C2.33630371,3.07006836 5.43261719,3.33813477 6.80957031,3.33813477 C8.18652344,3.33813477 11.3754883,3.07006836 11.3754883,3.07006836 C11.3754883,3.07006836 10.8122559,4.96514893 9.58630371,6.16516113 C8.36035156,7.36517334 7.09265137,8.2623291 7.09265137,8.2623291 L7.09265137,8.35028076 L7.09265137,8.46459961 L6.87243652,8.46459961 L6.87243652,8.35028076 L6.80957031,8.2623291 C6.80957031,8.2623291 4.9704053,7.27703707 3.96130371,5.96057129 C2.5045166,4.06005859 2.33630371,3.07006836 2.33630371,3.07006836 Z;
    
                                            
                                                                    M2.375,3.11462402 C2.375,3.11462402 5.71569824,3.44421387 7.09265137,3.44421387 C8.46960449,3.44421387 11.4150391,3.31262207 11.4150391,3.31262207 C11.4150391,3.31262207 10.8122559,4.96514893 9.58630371,6.16516113 C8.36035156,7.36517334 7.09265137,8.2623291 7.09265137,8.2623291 L7.09265137,15.5496216 L7.09265137,16.47052 L6.87243652,16.47052 L6.87243652,15.5496216 L6.80957031,8.2623291 C6.80957031,8.2623291 4.9704053,7.27703707 3.96130371,5.96057129 C2.5045166,4.06005859 2.375,3.11462402 2.375,3.11462402 Z;
                                            
                                                                    M2.49230957,3.31262207 C2.49230957,3.31262207 5.71569824,3.66851807 7.09265137,3.66851807 C8.46960449,3.66851807 11.3153076,3.53222656 11.3153076,3.53222656 C11.3153076,3.53222656 10.8122559,4.96514893 9.58630371,6.16516113 C8.36035156,7.36517334 7.09265137,8.2623291 7.09265137,8.2623291 L7.09265137,15.149231 L7.9152832,16.47052 L6.10144043,16.47052 L6.87243652,15.149231 L6.80957031,8.2623291 C6.80957031,8.2623291 4.9704053,7.27703707 3.96130371,5.96057129 C2.5045166,4.06005859 2.49230957,3.31262207 2.49230957,3.31262207 Z;
                                    
                                                M2.98474121,4.37164307 C2.98474121,4.37164307 5.49548338,4.7074585 6.87243651,4.7074585 C8.24938963,4.7074585 10.8119509,4.64428711 10.8119509,4.64428711 C10.8119509,4.64428711 10.8122559,4.96514893 9.58630371,6.16516113 C8.36035156,7.36517334 7.09265137,8.2623291 7.09265137,8.2623291 L7.09265137,12.5493774 L9.36248779,16.47052 L4.5581665,16.47052 L6.87243652,12.5493774 L6.80957031,8.2623291 C6.80957031,8.2623291 4.9704053,7.27703707 3.96130371,5.96057129 C2.5045166,4.06005859 2.98474121,4.37164307 2.98474121,4.37164307 Z;
                                            
                                            M4.49743651,6.36560059 C4.49743651,6.36560059 5.63000487,6.72412109 7.00695799,6.72412109 C8.38391112,6.72412109 9.56188963,6.36560059 9.56188963,6.36560059 C9.56188963,6.36560059 9.48870848,6.54571533 8.79962157,7.09661865 C8.11053465,7.64752197 7.09265137,8.2623291 7.09265137,8.2623291 L7.09265137,10.5493774 L11.4924319,16.4705197 L2.52148436,16.4705197 L6.87243652,10.5493774 L6.80957031,8.2623291 C6.80957031,8.2623291 6.01727463,8.16043491 4.82800292,6.81622307 C4.42932128,6.36560059 4.49743651,6.36560059 4.49743651,6.36560059 Z;
                                            
                                            M5.87017821,7.51904297 C5.87017821,7.51904297 6.14080809,7.70904542 6.87243651,7.64453126 C7.60406493,7.5800171 7.47180174,7.51904297 7.47180174,7.51904297 C7.47180174,7.51904297 8.51336669,7.23876953 7.82427977,7.78967285 C7.13519286,8.34057617 7.09265137,8.2623291 7.09265137,8.2623291 L7.09265137,10.5493774 L11.4924319,16.4705197 L2.52148436,16.4705197 L6.87243652,10.5493774 L6.80957031,8.2623291 C6.80957031,8.2623291 6.66632079,8.14239502 6.34619139,7.953125 C5.84610144,7.65745695 5.87017821,7.51904297 5.87017821,7.51904297 Z;
                                            
                                            M7.00695799,8.06219482 C7.00695799,8.06219482 6.27532958,8.12670898 7.00695799,8.06219482 C7.73858641,7.99768066 7.00695799,8.06219482 7.00695799,8.06219482 C7.00695799,8.06219482 7.78173827,7.71142576 7.09265135,8.26232908 C6.40356444,8.8132324 7.09265137,8.2623291 7.09265137,8.2623291 L7.09265137,10.5493774 L11.4924319,16.4705197 L2.52148436,16.4705197 L6.87243652,10.5493774 L6.80957031,8.2623291 C6.80957031,8.2623291 7.1925659,8.45159912 6.87243651,8.2623291 C6.37234656,7.96666105 7.00695799,8.06219482 7.00695799,8.06219482 Z;
                                            
                                            M7.00695799,10.3484497 C7.00695799,10.3484497 6.27532958,10.4129639 7.00695799,10.3484497 C7.73858641,10.2839355 7.00695799,10.3484497 7.00695799,10.3484497 C7.00695799,10.3484497 7.78173827,9.99768063 7.09265135,10.548584 C6.40356444,11.0994873 7.09265137,10.548584 7.09265137,10.548584 L7.09265137,10.5493774 L11.4924319,16.4705197 L2.52148436,16.4705197 L6.87243652,10.5493774 L6.80957031,10.548584 C6.80957031,10.548584 7.1925659,10.737854 6.87243651,10.548584 C6.37234656,10.2529159 7.00695799,10.3484497 7.00695799,10.3484497 Z;"
                                />
                                
                                <animate 
                            attributeName="fill" 
                dur=${duration} 
                repeatCount="once"
                keyTimes="0;
                        .5;
                        1"
                        
                values="#e2cba5;#e2cba5;#C62626;"
                                />
                </path>
            </g>
        </g>
    </svg></div>

    <div class="txt-center">
    <span id="timer">
        <span id="time"></span>    
    </span>
    </div>
    </div>`;
}
function SetupGMView()
{
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class=main>
        <div id="topMost">
        <div id="slideToggle">
        <label class="toggle">
        <span id="visibleLabel" class="toggle-label">Visible</span>
        <input id="visibleToggle" class="toggle-checkbox" type="checkbox" checked>
        <div class="toggle-switch"></div>
        </label>
        </div>
        <div id="timerArea" class="floatRight">0:00</div>
        </div>
        <div class="threeButtons">
            <div id="addTen" class="oneThird">+ 10M</div>
            <div id="addFive" class="oneThird">+ 5M</div>
            <div id="addOne" class="oneThird"> + 1M</div>
            <div id="addClassic" class="oneThird">+ 10S</div>
        </div>
        <div class="threeButtons minus">
            <div id="dropTen" class="oneFourth">- 10M</div>
            <div id="dropFive" class="oneFourth">- 5M</div>
            <div id="dropOne" class="oneFourth"> - 1M</div>
            <div id="dropClassic" class="oneFourth">- 10S</div>
        </div>
        <div class="timerButtons">
        <div id="startButton" class="button">Start <span class="material-symbols-outlined">
            </span></div>
        <div id="stopButton" class="button">Pause <span class="material-symbols-outlined">
            </span></div>
        <div id="resetButton" class="button">Reset <span class="material-symbols-outlined">
            </span></div>
        </div>
    </div>
    `
    //basic variables
    let m = 0, // time in minutes
        s = 0, // seconds counter\
        duration = 1000, // interval timer 1000 = 1 second
        timeSet = 0, // variable to handle time remaining
        started = false, // check if timer has started
        zuluStartTime,
        zuluEndTime;

    const stopButton = <HTMLInputElement>document.getElementById("stopButton")!;
    const resetButton = <HTMLInputElement>document.getElementById("resetButton")!;
    const startButton = <HTMLInputElement>document.getElementById("startButton")!;

    const visibleToggle = <HTMLInputElement>document.getElementById("visibleToggle")!;
    const visibleLabel = <HTMLLabelElement>document.getElementById("visibleLabel")!;
    let visible = visibleToggle.checked;

    const addClassic = document.getElementById("addClassic")!;
    const addOne = document.getElementById("addOne")!;
    const addFive = document.getElementById("addFive")!;
    const addTen = document.getElementById("addTen")!;

    const dropClassic = document.getElementById("dropClassic")!;
    const dropOne = document.getElementById("dropOne")!;
    const dropFive = document.getElementById("dropFive")!;
    const dropTen = document.getElementById("dropTen")!;

    const timerArea = document.getElementById("timerArea")!;
    const threeButtons = <HTMLElement>document.querySelector(".threeButtons")!;

    stopButton.hidden = true;

    visibleToggle.onchange = async function ()
    {
        visible = visibleToggle.checked;
        visibleLabel.innerText = visible ? "Visible" : "Hidden";

        // Send to OBR to sync player timers
        let TimeBomb: ITimeBomb = { visible: visible };

        let timerMeta: Metadata = {};
        timerMeta[`${Constants.EXTENSIONID}/metadata_timeritem`] = { TimeBomb };
        await OBR.scene.setMetadata(timerMeta);
    };

    // resets the timer to 0, removes the formatting and reinstates the hidden buttons
    resetButton.onclick = async function ()
    {
        timerArea.innerText = "0:00";
        threeButtons.hidden = false;
        startButton.hidden = false;
        stopButton.hidden = true;

        started = false;
        m = 0;
        s = 0;
        timeSet = 0;

        // Send to OBR to sync player timers
        let TimeBomb: ITimeBomb = {
            reset: true,
            start: false,
            visible: visible
        };

        let timerMeta: Metadata = {};
        timerMeta[`${Constants.EXTENSIONID}/metadata_timeritem`] = { TimeBomb };
        await OBR.scene.setMetadata(timerMeta);
        await ClearOBRBadge();
    };

    // adding time to the timer
    addClassic.onclick = async function ()
    {
        s += 10;
        if (started)
        {
            timeSet += 10;
            await SendTime();
        }
        if (s >= 60)
        {
            s = s - 60;
            m += 1;
        }
        if (s == 0 || s < 10)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };
    dropClassic.onclick = async function ()
    {
        if (s < 11 && m == 0) return;

        s -= 10;
        if (started)
        {
            timeSet -= 10;
            await SendTime();
        }
        if (s <= 0)
        {
            s = s + 60;
            m -= 1;
        }
        if (s == 0 || s < 10)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };

    addTen.onclick = async function ()
    {
        m += 10;
        if (started)
        {
            timeSet += 10 * 60;
            await SendTime();
        }
        if (s == 0)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };
    dropTen.onclick = async function ()
    {
        if (m < 10) return;
        m -= 10;
        if (started)
        {
            timeSet -= 10 * 60;
            await SendTime();
        }
        if (s == 0)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };

    addFive.onclick = async function ()
    {
        m += 5;
        if (started)
        {
            timeSet += 5 * 60;
            await SendTime();
        }
        if (s == 0)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };
    dropFive.onclick = async function ()
    {
        if (m < 5) return;

        m -= 5;
        if (started)
        {
            timeSet -= 5 * 60;
            await SendTime();
        }
        if (s == 0)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };

    addOne.onclick = async function ()
    {
        m += 1;
        if (started)
        {
            timeSet += 1 * 60;
            await SendTime();
        }
        if (s == 0)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };
    dropOne.onclick = async function ()
    {
        if (m < 1) return;

        m -= 1;
        if (started)
        {
            timeSet -= 1 * 60;
            await SendTime();
        }
        if (s == 0)
        {
            timerArea.innerText = `${m}:0${s}`;
        }
        else
        {
            timerArea.innerText = `${m}:${s}`;
        }
    };

    startButton.onclick = async function ()
    {
        if (m === 0 && s > 0)
        {
            timeSet = s; //set countdown to total seconds
        }
        else if (m > 0 && s === 0)
        {
            timeSet = m * 60; //set countdown to total seconds
        }
        else
        {
            timeSet = (m * 60) + s; //set countdown to total seconds
        }

        if (timeSet > 0 && started != true)
        {
            started = true;
            stopButton.hidden = false;
            startButton.hidden = true;
            resetButton.hidden = true;
            let x = setInterval(async function ()
            {
                timeSet--;
                s--;
                if (s <= -1)
                {
                    m--;
                    s = 60 - 1;
                }
                if (s < 10)
                {
                    timerArea.innerText = `${m}:0${s}`;
                } else
                {
                    timerArea.innerText = `${m}:${s}`;
                }

                stopButton.onclick = async function ()
                {
                    clearInterval(x);
                    startButton.hidden = false;
                    resetButton.hidden = false;
                    stopButton.hidden = true;
                    started = false;

                    // Send to OBR to sync player timers
                    let TimeBomb: ITimeBomb = {
                        start: false,
                        reset: false,
                        visible: visible
                    };

                    let timerMeta: Metadata = {};
                    timerMeta[`${Constants.EXTENSIONID}/metadata_timeritem`] = { TimeBomb };
                    await OBR.scene.setMetadata(timerMeta);
                    await SetTimerOBRBadge("Paused..");
                };

                if (timeSet <= 0)
                {
                    clearInterval(x);
                    //update buttons and Timer Area
                    timerArea.innerText = "Ding!";
                    threeButtons.hidden = true;
                    startButton.hidden = true;
                    stopButton.hidden = true;
                    resetButton.hidden = false;
                    snd.play();
                }

                // Update badge if multiple of 5 or if Time is up
                if (timeSet % 5 === 0 && timerArea.innerText !== "Ding!")
                {
                    await SetTimerOBRBadge(timerArea.innerText);
                }
                else if (timerArea.innerText === "Ding!")
                {
                    await AlarmOBRBadge();
                    setTimeout(() =>
                    {
                        resetButton.click();
                    }, 2000); // 10000 milliseconds = 10 seconds
                }
            }, duration);

            await SendTime();
        }


    };

    async function SendTime()
    {
        // Instead of sending an ending time (in case computers aren't synched) we send a start/end time and let the receiver calculate the difference
        // If we sent just the duration, it gets a little harder to tell when an updates happens. Ie; I originally have a 60 sec timer. 30 seconds go, and I send another 60 sec to reset it.
        // Because the numbers match, it won't get update.d
        // We get around this by sending unique time codes, but we only care about the difference. But it allows us to tell if it's a new timer or not easily.
        zuluStartTime = new Date(Date.now()).toISOString();
        zuluEndTime = new Date(Date.now() + (timeSet * 1000)).toISOString();

        // Send to OBR to sync player timers
        let TimeBomb: ITimeBomb = {
            startTime: zuluStartTime,
            endTime: zuluEndTime,
            start: true,
            reset: false,
            visible: visible
        };

        let timerMeta: Metadata = {};
        timerMeta[`${Constants.EXTENSIONID}/metadata_timeritem`] = { TimeBomb };
        await OBR.scene.setMetadata(timerMeta);
    }
}

async function ClearOBRBadge()
{
    await OBR.action.setBadgeText(undefined);
    await OBR.action.setBadgeBackgroundColor("#BB99FF");
}

async function SetTimerOBRBadge(text: string)
{
    const isOpen = await OBR.action.isOpen();
    if (!isOpen)
    {
        await OBR.action.setBadgeText(text);
        const badgeColor = currentTheme == "DARK" ? "yellow" : "#159cc5";
        await OBR.action.setBadgeBackgroundColor(badgeColor);
    }

}

async function AlarmOBRBadge()
{
    const isOpen = await OBR.action.isOpen();
    if (!isOpen)
    {
        await OBR.action.setBadgeText("Time's Up!");
        await OBR.action.setBadgeBackgroundColor("red");
    }
}

//Ding Noise
const snd = new Audio(Constants.DING);
