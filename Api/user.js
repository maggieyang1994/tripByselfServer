var webPush = require('web-push');
const { saveInDB, generateRandomString } = require('../utils');
const moment = require('moment')
module.exports = {
  async getUserDetail(pool, params, req, res) {
    let { userName, password } = params;
    let users = await pool.query(`select * from user where userName = '${userName}'`);
    console.log('users', users[0])
    if (!users.length) {
      return {
        code: 400,
        msg: '账号不存在'
      }
    } else {
      if (users[0].passWord !== password) return { code: 400, msg: '密码错误' }
      // 返回用户信息
      let userInfo = await pool.query(`select * from user_info where userId = ${users[0].userId}`);

      //生成user_token 
      await this.module.user.generageToken(pool, userInfo[0].name, res)
      return {
        code: 200,
        msg: { ...userInfo }
      }
    }
  },
  generageToken: async function (pool, login_id, res) {
    console.log("generageToken")
    let token = await pool.query(`select * from trip_user_token where login_id = '${login_id}' and token_is_active = 1`);
    if (!token.length) {
      // 第一次登陆 生成token
      await this.createToken(pool, login_id, res)
    } else {
      // 不是第一次登陆 看看有没有过期
      // let tempDate = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
      if (moment(token[0].token_exp_dt).isAfter(moment())) {
        // 没有过期  过期时间加一天
        let tempTime = moment().add(1, "days")
        let result = await pool.query(`update trip_user_token set token_exp_dt = '${moment(tempTime).format('YYYY-MM-DD HH:mm:ss')}' where token_id = ${token[0].token_id}`);
        // 注意 path
        if (result.serverStatus === 2) res.setHeader('Set-Cookie', `sessionId=${token[0].token_text};Expires=${moment(tempTime).toString()};HttpOnly;Path=/`)

      } else {
        // 过期了  //先注销再新建
        await pool.query(`update trip_user_token set token_is_active = 0 where token_id = ${token[0].token_id}`);
        await this.createToken(pool, login_id, res)
      }
    }
  },
  async createToken(pool, login_id, res) {
    console.log('createToken')
    let tokenText = generateRandomString(12);
    let obj = {
      token_text: tokenText,
      login_id,
      token_exp_dt: moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),
      token_is_active: 1
    };
    await saveInDB(pool, obj, 'trip_user_token');
    console.log(obj.token_exp_dt.toString())
    res.setHeader('Set-Cookie', `sessionId=${tokenText};Expires=${obj.token_exp_dt.toString()};HttpOnly;Path=/`)
  },
  generateKey() {
    let applicationKey = webPush.generateVAPIDKeys();
    return applicationKey
  },
  async saveFCMKey(pool, params) {
    let res = await saveInDB(pool, params, 'subscription');
    return res;
  },
  async sendNotifaction(pool) {
    let data = await pool.query('select * from subscription');
    // 给所有订阅的平台 都发送通知
    const payload = {
      title: '一篇新的文章',
      body: '点开看看吧',
      data: { url: "https://www.rrfed.com" }
    };
    data.forEach(x => {
      webPush.sendNotification(
        JSON.parse(x.subscription),
        JSON.stringify(payload)
      )
    });
    return {
      code: 200,
      msg: `发送了${data.length}条通知`
    }
  },
  async logout(pool, params, req, res) {
    // 登出  删除cookie
    let result = await pool.query(`update trip_user_token set token_is_active = 0 where login_id='${req.headers['login_id']}' and token_text = '${req.cookies.sessionId}'`);
    res.setHeader('Set-Cookie', `sessionId=${req.cookies.sessionId};Expires=${moment(new Date(-1)).toString()};HttpOnly;Path=/`);
    return result
  }
}