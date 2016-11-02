var client_id = '9307698323d44b158135c48936a25dbf';
var redirect_uri = encodeURIComponent('http://localhost:8080/afterAuth.html');
angular.module('spotifyApp').service('spotifyService', function($http, $q, $cookies) {
    //looks up ids of provided elements and
    //gets recommendations accordingly
    var token;
    this.getRecs = function(artist, song, genre) {
        token = this.getToken();
        console.log(artist + " " + song + " " + genre);
        var songInfo;
        var artistInfo;
        var deferred = $q.defer();

        //gets track ID and info
        search(song, "track").then(function(songRes) {
            songInfo = songRes;
            //gets artist ID and info
            search(artist, "artist").then(function(artistRes) {
                artistInfo = artistRes;
                //gets recommendations
                $http({
                    headers: {
                        "Authorization": 'Bearer ' + token
                    },
                    method: 'GET',
                    url: 'https://api.spotify.com/v1/recommendations?seed_tracks=' + songInfo.id + '&seed_artists=' + artistInfo.id + '&seed_genres=' + genre
                }).then(function(response) {
                    var recommendationsWithInfo = {};
                    console.log(response);
                    //array of recommendations with info about each one
                    var recArray = [];
                    var recommendations = response.data.tracks;
                    recommendations.forEach(function(rec) {
                        var name = rec.name;
                        search(name, "track").then(function(info) {
                            recArray.push(info);
                        });
                    });
                    recommendationsWithInfo.data = recArray;
                    deferred.resolve(recommendationsWithInfo);
                });
            });
        });
        return deferred.promise;
    };

    //gets a provided song/artists id, name,
    //popularity and an assosciated image
    var search = function(searchTerm, type) {
        var defer = $q.defer();

        $http({
            method: 'GET',
            url: 'https://api.spotify.com/v1/search?q=' + encodeURI(searchTerm) + "&type=" + type
        }).then(function(result) {
          console.log(result);
            var info =   {
                id: result.data[type + 's'].items[0].id,
                uri: "https://embed.spotify.com/?uri=" + result.data[type+ 's'].items[0].uri,
                name: result.data[type + 's'].items[0].name,
                popularity: result.data[type + 's'].items[0].popularity,
            };
            if(type === 'artist'){
                info.image = result.data.artists.items[0].images[0].url;
            }else{
                info.albumImg = result.data.tracks.items[0].album.images[0].url;
                info.preview = result.data.tracks.items[0].preview_url;
                info.artistInfo = {
                  name: result.data.tracks.items[0].artists[0].name,
                  id: result.data.tracks.items[0].artists[0].id
                };
                getInfo(info.id).then(function(result){
                  info.acoutsticness = result.acoutsticness;
                  info.danceability = result.danceability;
                  info.energy = result.energy;
                  info.instrumentalness = result.instrumentalness;
                  info.key = result.key;
                  info.tempo = result.tempo;
                });
            }
            console.log(info);
            defer.resolve(info);
        });
        return defer.promise;
    };


    //gets detailed statistics about and individual song
    var getInfo = function(songID) {
        var defer = $q.defer();
        $http({
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            method: 'GET',
            url: 'https://api.spotify.com/v1/audio-features/' + songID
        }).then(function(res) {
            defer.resolve({
                acousticness: res.data.acousticness,
                danceability: res.data.danceability,
                energy: res.data.energy,
                instrumentalness: res.data.instrumentalness,
                key: res.data.key,
                tempo: res.data.tempo
            });
        });
        return defer.promise;
    };

    //requests auth token
    this.authorize = function(){
      return $http({
        method:'GET',
        url:"https://accounts.spotify.com/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri + "&scope=user-library-modify%20user-top-read&response_type=token"
      });
    };

    //saves track to your library
    this.saveTrack = function(id){
      return $http({
        headers:{
          'Authorization': 'Bearer ' + token
        },
        method:'PUT',
        url:'https://api.spotify.com/v1/me/tracks?ids=' + id
      });
    };

    //save token to a cookie
    this.setToken = function(token){
      $cookies.put('token', token);
      console.log(token);
      this.token = token;

    };

    //gets token from a cookie
    this.getToken = function(){
      token = $cookies.get('token');
      console.log(token);
      return token;
    };
});
