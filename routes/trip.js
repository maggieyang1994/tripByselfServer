var express = require('express');
var router = express.Router();
let mysql = require("promise-mysql");
const connect = async() => {
  let pool = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Yt135212',
    database: 'trip'
  });
  return pool
}
router.get("/", async function(req, res, next){
  let pool = await connect();
  let data =await pool.query(`SELECT left(tripType, 2) as tripType,round(sum(distance), 2) as distance FROM trip.trip_data where userId = 1 and type ="trip" and tripType in ("骑车出行", "跑步出行","自驾出行","徒步出行") group by tripType;`);
  res.send(data)
})

module.exports = router;