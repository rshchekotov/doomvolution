# Doomvolution
This project revolves around a heavily configurable and
data-based Discord Bot. Don't try understanding it, k?
All I did was abuse the heck out of the 'raw' Discord.JS
Event, effectively handling all packets without a real 
event handler. The only thing I really use Discord.JS for 
is to send packets. ~~I really didn't want to program 
those as well.~~ Why do I do this? Well, first of all,
cuz I can. Second: it fixes a few issues and lifts some
limitations, such as the fact that I couldn't process 
messages, which were sent before the bot was started up!
So that took me here. You can try understanding the 
project, but if you wanna contribute, I'd highly suggest 
hitting me up, so I can walk you through the mess I 
produced!

## Self-Host
You can self-host this project. For that you need to 
setup a few things. Pre-Requisites are: 
- [Git](https://git-scm.com/)   
- [Docker](https://www.docker.com/)  
- [Docker-Compose](https://github.com/docker/compose/releases)  
- [Running Docker Daemon / Service](https://docs.docker.com/get-started/)  
- [Node.JS](https://nodejs.org/en/)  
- [PNPM](https://pnpm.io/installation)  
- [FFMPEG](https://ffmpeg.org/download.html)  
- [Discord Bot Token\[s\]](https://discord.com/developers/applications)  
- [Spotify API Credentials](https://developer.spotify.com/dashboard/applications)  
- [Google API Key](https://console.cloud.google.com/)  

Then you need to setup:
- Git Clone this Repository  
- Run `pnpm install` in the local repo  
- Setup Docker Secrets at `./secrets/{db_pass,db_user}`  
- Setup `.env`-file, with:
    - build_token: production discord token  
    - dev_token: dev discord token  
    - db_port: Port for the DB (same as configured in `docker-compose.yml`)  
    - db_name: Name for the DB (...)  
    - db_user: User for the DB (...)  
    - db_pass: Password for the DB (...)  
    - spotify_client: Spotify Client ID  
    - spotify_secret: Spotify Secret Key  
    - youtube_key: Google (YouTube) API Key  

## Submissions
*Note: You can message Doomer#3316 or Go#3741 via*
*Discord for suggestions! [or submit an issue with*
*the suggestion tag]*

## Good Music Collection
Yes, I need to include this, for this is music, 
I code with, which keeps me sane. Thanks to 
those artists my bug fixing journey becomes a 
bit more pleasant!  
- [You're Gonna Know My Name - Watt White ](https://www.youtube.com/watch?v=olRHsSYfHoo)[\[Nightcore\]](https://www.youtube.com/watch?v=0uUDCvOEAwE)
- [Dead Man Walking - Chuxx Morris](https://www.youtube.com/watch?v=RGBFwyqyloA)
- [Real Good Feeling - Oh The Larceny ](https://www.youtube.com/watch?v=G-Fz9GUQ13w)[\[Nightcore\]](https://www.youtube.com/watch?v=8q-AvRUR8bk)
- [Turn It Up - Oh The Larceny](https://www.youtube.com/watch?v=SMzTWbrqaIg)
