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

/* GET users listing. */
router.get('/', async function(req, res, next) {
    console.log(req, res);
    let pool = await connect()
    let {userName, password} = req.query;
    let users = await pool.query(`select * from user where userName = '${userName}'`);
    if(!users.length){
      res.send({
        code: 400,
        msg: '账号不存在'
      })
    }else{
      if(users[0].passWord !== password) res.send({code: 400, msg: '密码错误'})
      // 返回用户信息
      let userInfo = await pool.query(`select * from user_info where userId = ${users[0].userId}`)
      res.send({
        code: 200,
        msg: {...userInfo}
      })
    }
    
});

module.exports = router;
