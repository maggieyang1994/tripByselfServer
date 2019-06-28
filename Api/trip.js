const {saveInDB} = require('../utils')
module.exports = {
  async getTrips(pool){
    let data =await pool.query(`SELECT tripType as tripType,round(sum(distance), 2) as distance FROM trip.trip_data where userId = 1 and type ="trip" and tripType in ("骑车出行", "跑步出行","自驾出行","徒步出行") group by tripType;`);
    return data
  },
  async saveTrip(pool, param){
    let res = await saveInDB(pool, param, 'trip_data');
    return res;
  },
  async getTotalTrips(pool){
    let data = await pool.query(`select * from trip_data`);
    return data
  }
}