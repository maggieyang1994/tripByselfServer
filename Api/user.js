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
  }
}