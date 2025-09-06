"""
Spotify Status Display App
A Flask application that displays currently playing Spotify tracks with a React frontend.
"""

import os
import sys
import json
from datetime import timedelta
from http.client import HTTPException

from flask import Flask, session, request, redirect, render_template, send_from_directory, jsonify
import spotipy
from spotipy.oauth2 import SpotifyOAuth

# =============================================================================
# CONFIGURATION
# =============================================================================

# Debug mode - set to True for development
DEBUG = True

if DEBUG:
    from dotenv import load_dotenv
    load_dotenv()

# App configuration
app = Flask(__name__)

# Flask configuration
app.config.update(
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY"),
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_NAME="spotify_session",
    SESSION_COOKIE_SECURE=not DEBUG  # Only use secure cookies in production
)

# Spotify OAuth scope
SPOTIFY_SCOPE = " ".join([
    "user-read-currently-playing",
    "playlist-modify-private",
    "user-modify-playback-state",
    "user-library-read",
    "user-library-modify",
    "playlist-modify-public"
])


# Screen server configuration (optional)
SCREEN_SERVER_URL = os.getenv("SCREEN_SERVER_URL")

# Validate configuration
if not app.config["SECRET_KEY"]:
    sys.exit("ERROR: FLASK_SECRET_KEY environment variable not set.")

if SCREEN_SERVER_URL:
    print(f"Screen server configured at: {SCREEN_SERVER_URL}")

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def wants_json():
    """Check if the request wants JSON response instead of HTML."""
    # Check Accept header for JSON preference
    accept = request.headers.get('Accept', '')
    
    # Check for explicit HTML request (browser navigation)
    # Browsers typically send: text/html,application/xhtml+xml,...
    if accept.startswith('text/html'):
        return False
    
    # If Accept header explicitly prefers JSON
    if 'application/json' in accept:
        return True
    
    # For fetch() requests (usually */* or empty), return JSON
    # This handles React's fetch() which doesn't set specific Accept headers
    return True

def get_react_assets():
    """Read Vite manifest to get current build files."""
    manifest_path = 'static/react-build/.vite/manifest.json'
    
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        # Get the main entry point assets
        if 'index.html' in manifest:
            entry = manifest['index.html']
            return {
                'js_file': entry.get('file', ''),
                'css_files': entry.get('css', [])
            }
    except (FileNotFoundError, json.JSONDecodeError) as e:
        # Fallback if manifest doesn't exist
        print(f"Warning: Could not read Vite manifest: {e}")
    
    return {'js_file': '', 'css_files': []}

def get_spotify_auth_manager():
    """Create and return a Spotify auth manager."""
    cache_handler = spotipy.cache_handler.FlaskSessionCacheHandler(session)
    return SpotifyOAuth(
        scope=SPOTIFY_SCOPE,
        cache_handler=cache_handler,
        show_dialog=False,
    )

def get_spotify_client():
    """Get an authenticated Spotify client or None if not authenticated."""
    auth_manager = get_spotify_auth_manager()
    if not auth_manager.cache_handler.get_cached_token():
        return None
    return spotipy.Spotify(auth_manager=auth_manager)



def get_artists_string(artists_json):
    """Extract and join artist names from Spotify API response."""
    return ", ".join(artist["name"] for artist in artists_json)

def extract_track_info(track):
    """Extract and format track information from Spotify API response."""
    if not track or "item" not in track:
        return None
    
    item = track["item"]
    title = item["name"]
    artist = get_artists_string(item["artists"])
    album = item["album"]["name"]
    
    return {
        "id": item["id"],
        "title": title,
        "artist": artist,
        "album": album,
        "art_url": item["album"]["images"][0]["url"] if item["album"]["images"] else None,
        "year": item["album"]["release_date"][:4] if item["album"]["release_date"] else "",
        "is_playing": track.get("is_playing", False),
        "duration_ms": item["duration_ms"],
        "progress_ms": track.get("progress_ms", 0)
    }

# =============================================================================
# MIDDLEWARE
# =============================================================================

@app.before_request
def refresh_session():
    """Refresh session on each request to keep it alive."""
    session.permanent = True
    session.modified = True

# =============================================================================
# AUTHENTICATION ROUTES
# =============================================================================

@app.route("/")
def index():
    """Main route - handle authentication and serve React app."""
    auth_manager = get_spotify_auth_manager()
    
    # Handle OAuth callback
    if request.args.get("code"):
        auth_manager.get_access_token(request.args.get("code"))
        return redirect("/")
    
    # Check authentication status
    if not auth_manager.cache_handler.get_cached_token():
        auth_url = auth_manager.get_authorize_url()
        return render_template("login.html", auth_url=auth_url)
    
    # Get React assets from manifest
    assets = get_react_assets()
    
    # Serve React app for authenticated users
    return render_template("react_app.html", 
                         screen_server_url=SCREEN_SERVER_URL,
                         **assets)

@app.route("/sign_out")
def sign_out():
    """Sign out and clear session."""
    session.clear()
    return redirect("/")

# =============================================================================
# STATIC FILE SERVING
# =============================================================================

@app.route('/assets/<path:path>')
def serve_assets(path):
    """Serve React build assets."""
    return send_from_directory('static/react-build/assets', path)

# =============================================================================
# API ROUTES
# =============================================================================

@app.route("/api/currently_playing")
def currently_playing():
    """API endpoint to get the currently playing track with full details."""
    spotify = get_spotify_client()
    if not spotify:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        track = spotify.current_user_playing_track()
        
        if not track:
            return jsonify({"track": None, "screen_server_url": SCREEN_SERVER_URL})
        
        track_info = extract_track_info(track)
        if not track_info:
            return jsonify({"track": None, "screen_server_url": SCREEN_SERVER_URL})
        
        # Check if track is liked
        try:
            liked = spotify.current_user_saved_tracks_contains(tracks=[track_info["id"]])[0]
        except:
            liked = False
        
        return jsonify({
            "track": True,
            "title": track_info["title"],
            "artist": track_info["artist"],
            "album": track_info["album"],
            "art_url": track_info["art_url"],
            "year": track_info["year"],
            "song_id": track_info["id"],
            "currently_playing": track_info["is_playing"],
            "liked": liked,
            "screen_server_url": SCREEN_SERVER_URL
        })
    
    except Exception as e:
        print(f"Error fetching current track: {e}")
        return jsonify({"error": "Failed to fetch track"}), 500

@app.route("/api/current_track_xhr")
def current_track_status():
    """API endpoint to get lightweight track status for polling."""
    spotify = get_spotify_client()
    if not spotify:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        track = spotify.current_user_playing_track()
        current_id = request.args.get("id")
        
        if track:
            track_info = extract_track_info(track)
            if track_info:
                same_track = (track_info["id"] == current_id)
                
                # Check liked status for current track
                try:
                    liked = spotify.current_user_saved_tracks_contains(tracks=[current_id])[0] if current_id else False
                except:
                    liked = False
                
                return jsonify({
                    "progress": track_info["progress_ms"],
                    "duration": track_info["duration_ms"],
                    "same_track": same_track,
                    "currently_playing": track_info["is_playing"],
                    "liked": liked
                })
        
        # No track playing
        return jsonify({
            "progress": 0,
            "duration": 0,
            "same_track": not bool(current_id),  # Same if both are empty
            "currently_playing": False,
            "liked": False
        })
    
    except Exception as e:
        print(f"Error checking track status: {e}")
        return jsonify({"error": "Failed to check status"}), 500

# =============================================================================
# PLAYBACK CONTROL ROUTES
# =============================================================================

@app.route("/api/play")
def play():
    """API endpoint to start playback."""
    spotify = get_spotify_client()
    if not spotify:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        spotify.start_playback()
        return jsonify({"status": "playing"})
    except Exception as e:
        print(f"Error starting playback: {e}")
        return jsonify({"error": "Failed to start playback"}), 500

@app.route("/api/pause")
def pause():
    """API endpoint to pause playback."""
    spotify = get_spotify_client()
    if not spotify:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        spotify.pause_playback()
        return jsonify({"status": "paused"})
    except Exception as e:
        print(f"Error pausing playback: {e}")
        return jsonify({"error": "Failed to pause playback"}), 500

@app.route("/api/skip")
def skip():
    """API endpoint to skip to next track."""
    spotify = get_spotify_client()
    if not spotify:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        spotify.next_track()
        return jsonify({"status": "skipped"})
    except Exception as e:
        print(f"Error skipping track: {e}")
        return jsonify({"error": "Failed to skip track"}), 500

@app.route("/api/like")
def like():
    """API endpoint to like the current track."""
    spotify = get_spotify_client()
    if not spotify:
        return jsonify({"error": "Not authenticated"}), 401
    
    song_id = request.args.get("id")
    if not song_id:
        return jsonify({"error": "No song ID provided"}), 400
    
    try:
        spotify.current_user_saved_tracks_add(tracks=[song_id])
        return jsonify({"status": "liked", "song_id": song_id})
    except Exception as e:
        print(f"Error liking track: {e}")
        return jsonify({"error": "Failed to like track"}), 500

@app.route("/api/unlike")
def unlike():
    """API endpoint to unlike the current track."""
    spotify = get_spotify_client()
    if not spotify:
        return jsonify({"error": "Not authenticated"}), 401
    
    song_id = request.args.get("id")
    if not song_id:
        return jsonify({"error": "No song ID provided"}), 400
    
    try:
        spotify.current_user_saved_tracks_delete(tracks=[song_id])
        return jsonify({"status": "unliked", "song_id": song_id})
    except Exception as e:
        print(f"Error unliking track: {e}")
        return jsonify({"error": "Failed to unlike track"}), 500

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors specifically."""
    return render_template("error.html", 
                         error_code=404,
                         error_message="Page Not Found",
                         error_description="The page you're looking for doesn't exist."), 404

@app.errorhandler(HTTPException)
def handle_http_exception(e):
    """Handle HTTP exceptions."""
    # Define user-friendly messages for common HTTP errors
    error_messages = {
        404: "Page Not Found",
        401: "Please Sign In",
        403: "Access Denied",
        500: "Something Went Wrong",
        502: "Server Connection Error",
        503: "Service Temporarily Unavailable"
    }
    
    error_message = error_messages.get(e.code, f"Error {e.code}")
    error_description = e.description if hasattr(e, 'description') else str(e)
    
    return render_template("error.html", 
                         error_code=e.code,
                         error_message=error_message,
                         error_description=error_description), e.code

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle other exceptions."""
    print(f"Unhandled exception: {e}")
    return render_template("error.html", 
                         error_code=500,
                         error_message="Something Went Wrong",
                         error_description="An unexpected error occurred. Please try again."), 500

# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    # Validate required environment variables
    required_vars = ["SPOTIPY_CLIENT_ID", "SPOTIPY_CLIENT_SECRET", "SPOTIPY_REDIRECT_URI"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        sys.exit(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    print(f"Redirect URI: {os.getenv('SPOTIPY_REDIRECT_URI')}")
    
    # Use waitress for production-ready serving
    from waitress import serve
    
    # When running directly via python app.py, always use port 5000
    # (Production uses Gunicorn which reads PORT env var, not this code)
    port = 5000
    print(f"\n✨ Spotify Status app running at: http://127.0.0.1:{port}\n")
    serve(app, host="0.0.0.0", port=port)