//if the user clicks a button on screen, skip the next auto refresh
var ignoreAutoRefresh = false;

function play() {
    ignoreAutoRefresh = true;

    try {
        const req = new XMLHttpRequest();
        req.open("GET", "/play");
        req.send();

        //change icon to alternate
        var iconElement = document.querySelector('#play-pause-button .material-icons');
        iconElement.textContent = "pause";

        //change onclick function to alternate
        document.getElementById('play-pause-button').onclick = pause;
    } catch (error) {
        console.log("Unable to reach server");
    }
}

function pause() {
    ignoreAutoRefresh = true;

    try {
        const req = new XMLHttpRequest();
        req.open("GET", "/pause");
        req.send();
        var iconElement = document.querySelector('#play-pause-button .material-icons');
        iconElement.textContent = "play_arrow";

        document.getElementById('play-pause-button').onclick = play;
    } catch (error) {
        console.log("Unable to reach server");
    }
}

function skip() {
    try {
        const req = new XMLHttpRequest();
        req.open("GET", "/skip");
        req.send();
    } catch (error) {
        console.log("Unable to reach server");
    }
}

function like() {
    ignoreAutoRefresh = true;

    try {
        const req = new XMLHttpRequest();
        req.open("GET", "/like?id=" + window.SONG_ID);

        req.send();

        var iconElement = document.querySelector('#heart-button .material-icons');
        iconElement.textContent = "favorite";

        document.getElementById('heart-button').onclick = unlike;
    } catch (error) {
        console.log("Unable to reach server");
    }
}

function unlike() {
    ignoreAutoRefresh = true;

    try {
        const req = new XMLHttpRequest();
        req.open("GET", "/unlike?id=" + window.SONG_ID);
        req.send();

        var iconElement = document.querySelector('#heart-button .material-icons');
        iconElement.textContent = "favorite_border";

        document.getElementById('heart-button').onclick = like;
    } catch (error) {
        console.log("Unable to reach server");
    }
}


const colorThief = new ColorThief();
const img = document.querySelector('img');

function avg(color) {
    return (color[0] + color[1] + color[2]) / 3;
}

function setColors() {
    // have colorthief get background color, and palette to choose from for text color
    var backgroundColor = colorThief.getColor(img);
    var textColorArray = colorThief.getPalette(img);

    //set background color
    document.body.style.backgroundColor = 'rgb(' + backgroundColor[0] + ',' + backgroundColor[1] + ',' + backgroundColor[2] + ')';
    var backgroundColorAvg = avg(backgroundColor);

    //find the color that contrasts the most with the background color and use it for text
    var mostContrastingColor = textColorArray[0];

    // go through text color palette to determine what contrasts well
    for (const element of textColorArray) {
        var diffColorElement = Math.abs(avg(element) - backgroundColorAvg);
        var diffColorBest = Math.abs(avg(mostContrastingColor) - backgroundColorAvg);

        if (diffColorElement > diffColorBest) {
            mostContrastingColor = element;

        }
    }

    // colorDiff calculates the distance between the background color and the selected text color
    var colorDiff = avg(mostContrastingColor) - backgroundColorAvg;

    //debugging color choices
    //console.log("background color avg is " + backgroundColorAvg);
    // console.log("best selected text color avg is " + avg(mostContrastingColor));
    // console.log("color diff is " + colorDiff);

    // if the color difference is too low, override the text color to either white or black
    if (Math.abs(colorDiff) < 50) {
        console.log("color diff is too low, overriding text color");

        var black = [0, 0, 0];
        var white = [255, 255, 255];

        if (avg(mostContrastingColor) > 128) {
            mostContrastingColor = black;
        } else {
            mostContrastingColor = white;
        }
    }


    //set text color on page
    var textColor = mostContrastingColor;

    document.body.style.color = 'rgb(' + textColor[0] + ',' + textColor[1] + ',' + textColor[2] + ')';
    var buttons = document.getElementsByClassName("media-control-button");
    for (const element of buttons) {
        element.style.color = 'rgb(' + textColor[0] + ',' + textColor[1] + ',' + textColor[2] + ')';
    }

    document.getElementById('progress-bar-inner').style.backgroundColor = 'rgb(' + textColor[0] + ',' + textColor[1] + ',' + textColor[2] + ')';
    document.getElementById('progress-bar').style.backgroundColor = 'rgb(' + backgroundColor[0] + ',' + backgroundColor[1] + ',' + backgroundColor[2] + ')';

}

// Make sure image is finished loading
if (img.complete) {
    setColors();
} else {
    img.addEventListener('load', function () {
        setColors();
    });
}


/**
 * This function is called every 2 seconds to get the track info and playback info
 */
function reqListener() {
    if (!ignoreAutoRefresh) {
        var parsed = JSON.parse(this.responseText)
        //console.log(parsed)

        var duration = parsed["duration"]
        var progress = parsed["progress"]

        if (!parsed["same_track"]) {
            location.reload();

            //prevent progress bar smoothly adjusting back to 0
            document.getElementById('progress-bar-inner').style.transition = "0ms";
        }

        document.getElementById('progress-bar-inner').style.width = progress / duration * 101 + "%";

        var playIconElement = document.querySelector('#play-pause-button .material-icons');

        // Update the play/pause button based on auto refresh
        if (parsed["currently_playing"]) {
            playIconElement.textContent = "pause";
            document.getElementById('play-pause-button').onclick = pause;
            
            // Turn on screen when music starts playing
            if (window.SCREEN_SERVER_URL) {
                var turnOnRequest = new XMLHttpRequest();
                turnOnRequest.open("GET", window.SCREEN_SERVER_URL + "/TurnOnScreen", true);
                turnOnRequest.onerror = function() { console.log("Screen server not reachable"); };
                turnOnRequest.send(null);
            }
        } else {
            playIconElement.textContent = "play_arrow";
            document.getElementById('play-pause-button').onclick = play;
            
            // Turn off screen when music stops
            if (window.SCREEN_SERVER_URL) {
                var turnOffRequest = new XMLHttpRequest();
                turnOffRequest.open("GET", window.SCREEN_SERVER_URL + "/TurnOffScreen", true);
                turnOffRequest.onerror = function() { console.log("Screen server not reachable"); };
                turnOffRequest.send(null);
            }
        }

        // Update the like button based on auto refresh
        var heartIconElement = document.querySelector('#heart-button .material-icons');
        if (parsed["liked"]) {
            heartIconElement.textContent = "favorite";
            document.getElementById('heart-button').onclick = unlike;
        } else {
            heartIconElement.textContent = "favorite_border";
            document.getElementById('heart-button').onclick = like;
        }

    } else {
        console.log("ignoring auto refresh")
    }
}

// Reload the page if the request fails
function reloadPageListener() {
    location.reload();
}

// send requests to get the track info and playback info
function getTrackInfo() {
    ignoreAutoRefresh = false;
    try {
        const req = new XMLHttpRequest();
        req.addEventListener("load", reqListener);
        req.addEventListener("error", reloadPageListener)

        var iconElement = document.querySelector('#play-pause-button .material-icons');

        var currently_playing;

        if (iconElement.textContent === "pause") {
            currently_playing = true;
        } else {
            currently_playing = false;
        }

        req.open("GET", "/current_track_xhr?id=" + window.SONG_ID + "&currently_playing=" + currently_playing);
        req.send();

    } catch (error) {
        console.log("Unable to reach server");
    }
}

// Update the track info every 2 seconds
const interval = setInterval(function () {
    getTrackInfo()
}, 2000);