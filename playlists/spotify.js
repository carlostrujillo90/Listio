'use strict';

var access_token = '';
const request = require('request');
const clientID = process.env.CLIENT_ID;
const clientSECRET = process.env.CLIENT_SECRET;
const promiseRetry = require('promise-retry');
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";
const SPOTIFY_API_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Request options
function getTrackOptions(searchTerm, access_token) {
    const trackOptions = {
        url: SPOTIFY_SEARCH_URL,
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
        qs: {
            q: `${searchTerm}`,
            type: 'track',
            limit: '50'
        }
    };
    return trackOptions;
};

const tokenOptions = {
    url: SPOTIFY_API_TOKEN_URL,
    method: 'POST',
    headers: {
        Authorization: 'Basic ' + new Buffer(`${clientID}:${clientSECRET}`).toString('base64')
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

// Request tracks from Spotify
function requestTracks(searchTerm) {
    return new Promise((resolve, reject) => {
        request(getTrackOptions(searchTerm, access_token), (error, response, body) => {
            if (response.statusCode === 200) {
                console.log('200 OK tracks received');
                resolve(body);
            } else if ((JSON.parse(body).error.message === "The access_token expired") ||
                (response.statusCode === 400 || response.statusCode === 401)) { //refactor
                console.log('Expired or empty access_token:', access_token);
                requestToken().then(() => {
                    reject();
                });
            } else {
                console.log('oops, something went wrong');
                reject(JSON.parse(body).error.message);
            }
        });
    });
};

// Request access token from Spotify
function requestToken() {
    return new Promise((resolve, reject) => {
        request(tokenOptions, (error, response, body) => {
            if (response.statusCode === 200) {
                access_token = body.access_token;
                console.log('access_token generated');
                console.log('access_token =', access_token);
                resolve();
            } else {
                console.log('oops, the access_token was not generated correctly');
                reject();
            }
        });
    });
};

// Normalize track data
function normalizeTracks(trackItem){      
    let track = {
        songId: trackItem.id,
        songTitle: trackItem.name,
        songArtist: trackItem.artists[0].name,
        songAlbum: trackItem.album.name,
        releaseDate: trackItem.album.release_date,
        duration: trackItem.duration_ms,
        thumbnail: trackItem.album.images[1].url, 
        explicit: trackItem.explicit, 
        preview: trackItem.preview_url,
        popularity: trackItem.popularity
    }        
    return track;
};

// Handler for search tracks
function searchTrack(searchTerm) {
    return promiseRetry((retry, number) => {
            console.log('attempt number', number);
            return requestTracks(searchTerm)
                .catch(retry);
            })
            .then((result) => {
                let data = JSON.parse(result);                
                let tracks = data.tracks.items.map(item => {                                        
                    return normalizeTracks(item);                   
                });
                return tracks;
            }, (err) => {
                console.log('Something went wrong, error: ', err);
            });
};

module.exports = {searchTrack};