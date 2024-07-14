//import packages needed
const pg = require("pg");
const express = require("express");
//create client connection to the database
const client = new pg.Client(
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/the_acme_ice_cream_db"
);
//create the express server
const server = express();

//function to create our database table, seed data into the tables when first starting the server
const init = async () => {
//wait for the client to connect to the database
    await client.connect();
    console.log('connected to database');

//create SQL to wipe the database and create a new table based on our schema
    let SQL = `DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY, 
        flavor VARCHAR(255), 
        quantity INTEGER DEFAULT 3 NOT NULL, 
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now();
    )`;
//wait for the database to process the query
    await client.query(SQL);
    console.log('table created');

//create SQL statement to insert 3 new rows of data into our table
    SQL = `INSERT INTO notes(flavor, quantity) VALUES ('strawberry', 12);
    INSERT INTO notes(flavor, quantity) VALUES ('vanilla', 15);
    INSERT INTO notes(flavor, quantity) VALUES ('chocolate chip', 14);`;
//wait for the database to process the query
    await client.query(SQL);
    console.log('table seeded');

//have the server listen on a port
    const port = process.env.PORT || 3000;
    server.listen(port, () => console.log(`listening on port ${port}`));

};


//call the function so the server can start
init();

//middleware to use before all routes
server.use(express.json()); //parses the request body so our route can access it
server.use(require("morgan")("dev")); //logs the requests received to the server

//routes
//returns an array of note objects
server.get("api/flavors", async (req, res, next) => {
    try{
        //create the SQL query to select all the notes in descending order based on when they were created
        const SQL = `SELECT * from flavors ORDER By created_at DESC`;
        //await the response from the client querying the database
        const response = await client.query(SQL);
        //send the response. If no status code is given express will send 200 by default
        res.send(response.rows);
    }
    catch (error) {
next(error);
    }
});


server.get("api/flavors/:id", async (req, res, next) => {
    try{
        //create the SQL query to select all the notes in descending order based on when they were created
        const SQL = `SELECT * from flavors WHERE id = $1 ORDER By created_at DESC`;
        //await the response from the client querying the database
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows);
        //send the response. If no status code is given express will send 200 by default
        res.send(response.rows);
    }
    catch (error) {
next(error);
    }
});

//adds a new note to the table
server.post("api/flavors", async (req, res, next) => {
    try{
        //destructure the keys needed from the request body
        const {flavor, quantity} = req.body;

        //create the SQL query to create a new note based on the information in the request body
        const SQL = `INSERT into flavors (flavor, quantity) VALUES($1, $2) ORDER By created_at DESC`;

        //await the response from the client querying the database
        const response = await client.query(SQL, [flavor,quantity]);

        //send the response. If no status code is given express will send 200 by default
        res.status(201).send(response.rows[0]);
    }
    catch (error) {
next(error);
    }
});

//edits a note based on the id passed and information within the request body
server.put("api/flavors/:id", async (req, res, next) => {  try {
    const SQL = `
    UPDATE flavors
    SET flavor=$1, quantity=$2, updated_at=now()
    WHERE id=$3 RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.flavor,
      req.body.quantity,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

//deletes a note based on the id given
server.delete("api/flavors/:id", async (req, res, next) => { try {
    const SQL = `
    DELETE from flavors
    WHERE id=$1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
  }
});

