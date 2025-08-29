"""
CS50 Final Project: Spotify Status - Roman Garms

Prerequisites

    Install prereqs from requirements.txt

    // from your [app settings](https://developer.spotify.com/dashboard/applications)

    export SPOTIPY_CLIENT_ID=client_id_here
    export SPOTIPY_CLIENT_SECRET=client_secret_here
    export SPOTIPY_REDIRECT_URI='http://127.0.0.1:5000' // must contain a port

    // set the redirect url to 'http://127.0.0.1:5000' for testing on your local machine. When hosting, you will need to change that to the address of the device you are hosting on. 
    // SPOTIPY_REDIRECT_URI must be added to your [app settings](https://developer.spotify.com/dashboard/applications)
    // on Windows, use `SET` instead of `export`

Run app.py
    python3 app.py OR python3 -m flask run
    Alternatively, run using the launch.json under .vscode/ with the VSCode debugger
"""

from http.client import HTTPException
import os
from flask import Flask, session, request, redirect, render_template
import spotipy
import json
import sys
import re
from datetime import timedelta

debug = True

if debug:
    # Load environment variables from .env file
    from dotenv import load_dotenv

    load_dotenv()  # take environment variables from .env.

app = Flask(__name__)

# Use environment variable for Flask secret key
flask_secret = os.getenv("FLASK_SECRET_KEY")
if flask_secret:
    app.config["SECRET_KEY"] = flask_secret
else:
    # Production - require environment variable
    print(f"ERROR: FLASK_SECRET_KEY environment variable not set.")
    sys.exit("Missing FLASK_SECRET_KEY for production deployment")

# Configure client-side session cookies
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)  # Refreshes on each request
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_NAME"] = "spotify_session"
# Only use secure cookies in production
if not debug:
    app.config["SESSION_COOKIE_SECURE"] = True

@app.before_request
def before_request():
    """Refresh session on each request to keep it alive"""
    session.permanent = True
    # This refreshes the cookie expiration on each request
    session.modified = True
maxTitleLength = 25
maxArtistLength = 35
maxAlbumLength = 20


@app.route("/")
def index():
    cache_handler = spotipy.cache_handler.FlaskSessionCacheHandler(session)
    auth_manager = spotipy.oauth2.SpotifyOAuth(
        scope="user-read-currently-playing playlist-modify-private user-modify-playback-state user-library-read user-library-modify playlist-modify-private playlist-modify-public",
        cache_handler=cache_handler,
        show_dialog=False,
    )

    if request.args.get("code"):
        # Step 2. Being redirected from Spotify auth page
        auth_manager.get_access_token(request.args.get("code"))
        return redirect("/")

    # Check if we have a token in the cache
    token_info = cache_handler.get_cached_token()
    if not token_info:
        # Step 1. Display sign in link when no token at all
        auth_url = auth_manager.get_authorize_url()
        return render_template("login.html", auth_url=auth_url)

    # Step 3. We have a token (expired or not), let Spotipy handle refresh
    # and go to currently_playing
    return redirect("/currently_playing")


@app.route("/sign_out")
def sign_out():
    session.pop("token_info", None)
    return redirect("/")


@app.route("/currently_playing")
def currently_playing():
    spotify = get_spotify()
    if not spotify:
        return redirect("/")
    track = spotify.current_user_playing_track()
    if track is not None:
        title = track["item"]["name"]
        artist = get_artists(track["item"]["artists"])
        album = track["item"]["album"]["name"]
        album = format_album(title, album)
        artist = format_artist(artist)
        title = format_title(title)
        art_url = track["item"]["album"]["images"][0]["url"]
        year = track["item"]["album"]["release_date"][:4]
        song_id = track["item"]["id"]
        liked = spotify.current_user_saved_tracks_contains(tracks=[song_id])[0]
        currently_playing = track["is_playing"]
        return render_template(
            "currently_playing.html",
            title=title,
            artist=artist,
            album=album,
            art_url=art_url,
            year=year,
            song_id=song_id,
            currently_playing=currently_playing,
            liked=liked,
            json=json.dumps(track, indent=2),
        )
    return render_template("not_playing.html")


# debugging
@app.route("/debug")
def debug():
    spotify = get_spotify()
    if not spotify:
        return redirect("/")
    track = spotify.current_user_playing_track()
    duration = track["item"]["duration_ms"]
    progress = track["progress_ms"]

    return "duration is " + str(duration) + " and progress is " + str(progress)


# pinged every ~2 sec to see if refresh of page is required
@app.route("/current_track_xhr")
def current_track_xhr():
    spotify = get_spotify()
    if not spotify:
        return {"error": "Not authenticated"}, 401
    track = spotify.current_user_playing_track()

    if track is not None:
        new_id = track["item"]["id"]
        song_id = request.args.get("id")
        spotapi_currently_playing = track["is_playing"]
        currently_playing = request.args.get("currently_playing") == "True"
        if song_id == new_id:
            same_track = True
        else:
            same_track = False
        duration = track["item"]["duration_ms"]
        progress = track["progress_ms"]

        try:
            liked = spotify.current_user_saved_tracks_contains(tracks=[song_id])[0]
        except spotipy.exceptions.SpotifyException:
            liked = False

    else:
        spotapi_currently_playing = False
        currently_playing = request.args.get("currently_playing") == "True"
        if currently_playing == spotapi_currently_playing:
            same_track = True
        else:
            same_track = False
        duration = 0
        progress = 0
        liked = False

    # getting more info to pass through to page

    currently_playing = spotapi_currently_playing

    return_array = {
        "progress": progress,
        "duration": duration,
        "same_track": same_track,
        "currently_playing": currently_playing,
        "liked": liked,
    }

    return return_array


# end of html pages, now just assorted methods


def get_artists(artists_json):
    artists = []
    for artist in artists_json:
        artists.append(artist["name"])
    return ", ".join(artists)


@app.route("/play")
def play():
    spotify = get_spotify()
    if not spotify:
        return redirect("/")
    spotify.start_playback()
    return "playing"


@app.route("/pause")
def pause():
    spotify = get_spotify()
    if not spotify:
        return redirect("/")
    spotify.pause_playback()
    return "pausing"


@app.route("/skip")
def skip():
    spotify = get_spotify()
    if not spotify:
        return redirect("/")
    spotify.next_track()
    return "skipping"


@app.route("/like")
def like():
    spotify = get_spotify()
    if not spotify:
        return redirect("/")
    song_id = request.args.get("id")
    spotify.current_user_saved_tracks_add(tracks=[song_id])
    return "liking"


@app.route("/unlike")
def unlike():
    spotify = get_spotify()
    if not spotify:
        return redirect("/")
    song_id = request.args.get("id")
    spotify.current_user_saved_tracks_delete(tracks=[song_id])
    return "unliking"

@app.errorhandler(HTTPException)
def handle_exception(e):
    # Handle HTTP exceptions
    return render_template("error.html", error=e), e.code

@app.errorhandler(Exception)
def handle_exception(e):
    # Handle other exceptions
    return render_template("error.html", error=e), e.code


def get_spotify():
    cache_handler = spotipy.cache_handler.FlaskSessionCacheHandler(session)
    auth_manager = spotipy.oauth2.SpotifyOAuth(
        scope="user-read-currently-playing playlist-modify-private user-modify-playback-state user-library-read user-library-modify playlist-modify-private playlist-modify-public",
        cache_handler=cache_handler,
        show_dialog=False,
    )
    
    # Check if we have any token at all
    if not cache_handler.get_cached_token():
        return None
    
    # Let Spotipy handle token refresh automatically
    return spotipy.Spotify(auth_manager=auth_manager)


def shorten_text(string, length):
    return string[:length] + "..."


def format_title(title):
    title = re.sub("\(feat\. .+\)", "", title)
    if len(title) > maxTitleLength:
        title = shorten_text(title, maxTitleLength)
    return title


def format_artist(artist):
    if len(artist) > maxArtistLength:
        return shorten_text(artist, maxArtistLength)
    return artist


def format_album(title, album):
    if len(album) > maxAlbumLength:
        if album == title:
            return ""
        else:
            return shorten_text(album, maxAlbumLength)
    return album


"""
Following lines allow application to be run more conveniently with
`python3 app.py` (Make sure you're using python3)
"""
if __name__ == "__main__":
    if os.getenv("SPOTIPY_CLIENT_ID") == None:
        sys.exit("Missing Environment Variable: SPOTIPY_CLIENT_ID")
    if os.getenv("SPOTIPY_CLIENT_SECRET") == None:
        sys.exit("Missing Environment Variable: SPOTIPY_CLIENT_SECRET")
    if os.getenv("SPOTIPY_REDIRECT_URI") == None:
        sys.exit("Missing Environment Variable: SPOTIPY_REDIRECT_URI")
    print(os.getenv("SPOTIPY_REDIRECT_URI"))
    from waitress import serve

    serve(app, host="0.0.0.0", port=8100)
