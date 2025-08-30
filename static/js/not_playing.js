// Turn off screen when nothing is playing (only if screen server is configured)
if (window.SCREEN_SERVER_URL) {
    var turnOffRequest = new XMLHttpRequest();
    turnOffRequest.open("GET", window.SCREEN_SERVER_URL + "/TurnOffScreen", true);
    turnOffRequest.onerror = function() { console.log("Screen server not reachable"); };
    turnOffRequest.send(null);
}

function reqListener() {
    var parsed = JSON.parse(this.responseText)
    //console.log(parsed)

    if (!parsed["same_track"]) {
        location.reload();
    }
}
function reloadPageListener() {
    location.reload();
}

function compareTrack() {
    try {
        const req = new XMLHttpRequest();
        req.addEventListener("load", reqListener);
        req.addEventListener("error", reloadPageListener)
        req.open("GET", "/current_track_xhr?id=" + window.SONG_ID + "&currently_playing=" + window.CURRENTLY_PLAYING);
        req.send();
    } catch (error) {
        console.log("Unable to reach server");
        location.reload();
    }
}

const interval = setInterval(function () {
    compareTrack()
}, 2000);