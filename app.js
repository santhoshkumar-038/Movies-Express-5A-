const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Port is Running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DATABASE ERROR ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToMovieNameObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

const getMovieDetailsInResponseFormate = (dbObject) => {
  const { movie_id, director_id, movie_name, lead_actor } = dbObject;
  return {
    movieId: movie_id,
    directorId: director_id,
    movieName: movie_name,
    leadActor: lead_actor,
  };
};
const getDirectorDetailsInResponseFormate = (dbObject) => {
  const { director_id, director_name } = dbObject;
  return {
    directorId: director_id,
    directorName: director_name,
  };
};

//Get Movie Name

app.get("/movies/", async (request, response) => {
  const getMovieName = `
    SELECT
        movie_name
    FROM
        movie; 
    `;
  const movies = await db.all(getMovieName);
  const result = movies.map((movieName) =>
    convertDbObjectToMovieNameObject(movieName)
  );
  response.send(result);
});

//POST NEW MOVIE
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
  INSERT INTO 
  movie 
  (director_id,movie_name,lead_actor)
  VALUES
  (${directorId},'${movieName}','${leadActor}')
  `;

  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastId;
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
  SELECT 
  * 
  FROM 
    movie 
  WHERE 
    movie_id=${movieId};`;
  try {
    const movieDetails = await db.get(getMovieQuery);
    response.send(getMovieDetailsInResponseFormate(movieDetails));
  } catch (error) {
    console.log(error.message);
  }
});

app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
    UPDATE 
    movie
    SET
     director_id=${directorId},
     movie_name='${movieName}',
     lead_actor='${leadActor}'
    WHERE
     movie_id=${movieId}
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  DELETE FROM
    movie
  WHERE
    movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director`;
  const dbData = await db.all(getDirectorsQuery);
  response.send(
    dbData.map((eachData) => getDirectorDetailsInResponseFormate(eachData))
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorsQuery = `
  SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id=${directorId};`;
  const dbData = await db.all(getDirectorsQuery);
  response.send(
    dbData.map((eachData) => getMovieDetailsInResponseFormate(eachData))
  );
});

module.exports = app;
