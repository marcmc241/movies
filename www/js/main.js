var db;
var mov=[];
var api='';//INSERT API KEY

function init(){
   
    getMoviesListAndDrawList();
    
    $("#pageone1").click(function(){goToPageOne();})
    $("#pageone2").click(function(){goToPageOne();})
    $("#pagetwo1").click(function(){goToPageTwo();})
    $("#pagetwo2").click(function(){goToPageTwo();})
    db = window.sqlitePlugin.openDatabase({ name: 'movie.db', location: 'default' }, function (db) {

      db.transaction(function (tx) {
      tx.executeSql('CREATE TABLE IF NOT EXISTS favourites (id INTEGER PRIMARY KEY, title TEXT, overview TEXT, date TEXT, poster TEXT, backdrop TEXT)');
      }, function (error) {
          alert('db transaction error: ' + error.message);
      }, function () {
          //alert('db creation ok');
      });

  }, function (error) {
     alert('Open database ERROR: ' + JSON.stringify(error));
  });
    updateFavourites();//update favourites when initialize
}

function goToPageOne() {
  $.mobile.navigate("#pageone", {});
}

function goToPageTwo() {
  $.mobile.navigate("#pagetwo", {});
}

function goToPageThree(mid, local) {
  //if local is 0, load from api, if is 1 load from DB
  $.mobile.navigate("#pagethree", {});
  //reset all elements
  $("#backdrop").attr("src",'');
  $("#poster").attr("src",'');
  $("#title").html('Loading...');
  $("#overview").html('');
  $("#date").html('');
  $("#favourite").unbind( "click" );
  $("#favourite").html('');
  if (local==1) {
    db.transaction(function (tx) {
    //select by movie id from favourites table
      tx.executeSql('SELECT * FROM favourites WHERE id=?', [mid], loadMovieLocal, function (error) {
        alert('transaction error: ' + error.message);
    });
  });
  }else{//load via the api function
    getMovieAndDrawDetail(mid);
  }
  //alert(mid);
}

function getMovieAndDrawDetail(mid){
    
     var request = $.ajax({
          url: "https://api.themoviedb.org/3/movie/"+mid+"?api_key="+api,
          method: "GET"
        });

        request.done(function( result ) {
            //Set all elements
            $("#backdrop").attr("src",'http://image.tmdb.org/t/p/w342//' + result.backdrop_path);
            $("#poster").attr("src",'http://image.tmdb.org/t/p/w342//' + result.poster_path);
            $("#title").html(result.original_title);
            $("#overview").html(result.overview);
            $("#date").html(result.release_date);
            mov=[result.id, result.original_title, result.overview, result.release_date, result.poster_path, result.backdrop_path];//save in a vector
            db.transaction(function (tx) {
              //search if the movie is in favourites table
              tx.executeSql('SELECT * FROM favourites WHERE id=?', [result.id], checkmovie, function (error) {
                alert('select transaction error: ' + error.message);
              });
            });
        });

        request.fail(function( jqXHR, textStatus ) {
          alert( "Request failed: " + textStatus );
    });
}

function getMoviesListAndDrawList(){//load list by popularity
    var theList = $("#mylist");
    
     var request = $.ajax({
          url: "https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key="+api,
          method: "GET"
        });

        request.done(function( moviesList ) {
            
            for (i=0;i<moviesList.results.length;i++){
                  theList.append( "<li><a href='#' class='movie' onclick='goToPageThree(" + moviesList.results[i].id + ",0);'><img class='poster' src='http://image.tmdb.org/t/p/w342//" + moviesList.results[i].poster_path + "'>" + moviesList.results[i].original_title + "</a></li>");
                }
            
            theList.listview("refresh");
            
            });
        request.fail(function( jqXHR, textStatus ) {
          alert( "Request failed: " + textStatus );
    });
}

function favourite(ad) {//add or delete movie from favourites table
  if (ad==0) {
    //add to favourites
    db.transaction(function (tx) {
    tx.executeSql('INSERT INTO favourites (id,title,overview,date,poster,backdrop) VALUES (?,?,?,?,?,?)', mov, function (resultSet) {
      }, function(error) {
        console.log('INSERT error: ' + error.message);
      });
    });
    $("#favourite").unbind( "click" );//clear click
    $("#favourite").click(function(){favourite(1);})
    $("#favourite").removeClass( "ui-icon-star" ).addClass( "ui-icon-delete" );
    $("#favourite").html('Delete from Favourites');
    updateFavourites();
  }else{
    //delete from favourites
    db.transaction(function (tx) {
      tx.executeSql('DELETE FROM favourites WHERE id=?', [mov[0]], function (resultSet) {}, function(error) {
        console.log('DELETE error: ' + error.message);
      });
    });
    $("#favourite").unbind( "click" );//clear click
    $("#favourite").click(function(){favourite(0);})
    $("#favourite").removeClass( "ui-icon-delete" ).addClass( "ui-icon-star" );
    $("#favourite").html('Add to Favourites');
    updateFavourites();
  }
}

function checkmovie(tx, results){//check if movie is en favourites list to change the button
  if(results.rows.length>=1){
    //is in favourites
    $("#favourite").unbind( "click" );//clear click
    $("#favourite").click(function(){favourite(1);})
    $("#favourite").removeClass( "ui-icon-star" ).addClass( "ui-icon-delete" );
    $("#favourite").html('Delete from Favourites');
  }else{
    //is not in favourites
    $("#favourite").unbind( "click" );//clear click
    $("#favourite").click(function(){favourite(0);})
    $("#favourite").removeClass( "ui-icon-delete" ).addClass( "ui-icon-star" );
    $("#favourite").html('Add to Favourites');
  }
}

function updateFavourites() {//update favourites list
  db.transaction(function (tx) {
    //select all rows to show the list
      tx.executeSql('SELECT * FROM favourites', [], updateSuccess, function (error) {
        alert('transaction error: ' + error.message);
    });
  });
}

function updateSuccess(tx, results) {
    var FList = $("#favouriteslist");
    FList.html("");
    for (i=0;i<results.rows.length;i++){
        FList.append( "<li><a href='#' class='movie' onclick='goToPageThree(" + results.rows.item(i).id + ",1);'><img class='poster' src='http://image.tmdb.org/t/p/w342//" + results.rows.item(i).poster + "'>" + results.rows.item(i).title + "</a></li>");
    }
    FList.listview("refresh");

    if (results.rows.length==0) {
      rows = "There are no favourite movies.";
    }
}

function loadMovieLocal(tx, results) {//load the movie data from local DB
            $("#backdrop").attr("src",'http://image.tmdb.org/t/p/w342//' + results.rows.item(0).backdrop);
            $("#poster").attr("src",'http://image.tmdb.org/t/p/w342//' + results.rows.item(0).poster);
            $("#title").html(results.rows.item(0).title);
            $("#overview").html(results.rows.item(0).overview);
            $("#date").html(results.rows.item(0).date+" Loaded locally");
            mov=[results.rows.item(0).id, results.rows.item(0).title, results.rows.item(0).overview, results.rows.item(0).date, results.rows.item(0).poster, results.rows.item(0).backdrop];
            db.transaction(function (tx) {
              //search if the movie is in favourites table
              tx.executeSql('SELECT * FROM favourites WHERE id=?', [results.rows.item(0).id], checkmovie, function (error) {
                alert('select transaction error: ' + error.message);
              });
            });
 }