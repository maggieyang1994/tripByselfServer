var webPush = require('web-push');
const {saveInDB} = require('../utils')
module.exports = {
  async getUserDetail(pool, params, req, res){
    console.log(req, res);
    let {userName, password} = params;
    let users = await pool.query(`select * from user where userName = '${userName}'`);
    if(!users.length){
      return {
        code: 400,
        msg: '账号不存在'
      }
    }else{
      if(users[0].passWord !== password) return{code: 400, msg: '密码错误'}
      // 返回用户信息
      let userInfo = await pool.query(`select * from user_info where userId = ${users[0].userId}`)
      return {
        code: 200,
        msg: {...userInfo}
      }
    }
  },
  generateKey(){
    let applicationKey = webPush.generateVAPIDKeys();
    return applicationKey
  },
  async saveFCMKey(pool, params){
    let res = await saveInDB(pool, params, 'subscription');
    return res;
  },
  async sendNotifaction(pool){
    let data = await pool.query('select * from subscription');
    // 给所有订阅的平台 都发送通知
    const payload = {
      title: '一篇新的文章',
      body: '点开看看吧',
      data: {url: "https://www.rrfed.com"}
    };
    data.forEach(x => {
      webPush.sendNotification({
        endpoint: x.endpoint,
        payload
      })
    });
    return {
      code: 200,
      msg: `发送了${data.length}条通知`
    }
  }
}