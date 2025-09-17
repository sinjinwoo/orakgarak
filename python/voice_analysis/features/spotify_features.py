import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
import pprint

# .env 로드
load_dotenv()

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

auth_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
sp = spotipy.Spotify(auth_manager=auth_manager)
# result = sp.search("coldplay", limit=1,type='artist')
# results = sp.search(q="track:Dynamite artist:BTS", type="artist", limit=1)
results = sp.track("3P3UA61WRQqwCXaoFOTENd")
pprint.pprint(results)
