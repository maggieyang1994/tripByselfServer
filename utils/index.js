const fs = require("fs")
const path = require("path")
const url = require("url")
const readFile = (dirPath, list = []) => {
    return new Promise((resolve, reject) => {
        let temp = path.resolve(dirPath);
        // let curPath = path.resolve('tripByselfServer', dirPath)
        fs.readdir(temp, async (err, file) => {
            if (err) reject(err);
            for (let i = 0; i < file.length; i++) {
                let curFile = file[i];
                let tempFile = path.resolve(dirPath, curFile)
                // let tempFile = path.resolve('tripByselfServer', dirPath, curFile)
                if (fs.statSync(tempFile).isDirectory()) {
                    await readFile(tempFile, list)
                } else {
                    if (/\.js$/.test(curFile)) list.push(path.resolve(tempFile))
                }
            }
            resolve(list)
        })
    })

}

const parseHttpRequest = (req) => {
    var parsedUrl = url.parse(req.baseUrl);
    // console.log(req, req.baseUrl)
    var sPath = parsedUrl.pathname.replace('#', '')
    var sPathMatch = sPath.match('([^/]+)(?=/[^/]+/?$)')
    var target = null
    var method = null
    var service = null
    if (sPathMatch && sPathMatch.length > 0) {
        target = sPathMatch[0]
        method = sPath.replace(/.*\//, '')
        service = global.module[target][method]
    }
    else {
        // console.log('Fail to parse http request, url:', req.url)
    }
    var param = { ...req.body, ...req.query }
    if (!param.data) param.data = {}
    return {
        parsedUrl,
        sPath,
        target,
        method,
        service,
        param
    }
}
const getInsertSqlStr = async (pool, param, dbName) => {
    try {
        let res = await pool.query(`select column_name as columnName from information_schema.columns where table_name='${dbName}'`);
        // console.log(res);
        let column_name = res.map(x => x.columnName)
        let str = ''
        for (let columnName of column_name) {
            str += `${columnName} = ${param[columnName] ? `'${param[columnName]}'` : null},`
        };
        return `insert into ${dbName} set ${str.substring(0, str.length - 1)}`
    } catch (e) {
        throw error(JSON.stringify(e))
    }

}
const saveInDB = async (pool, param, dbName) => {
    !Array.isArray(param) && (param = [param]);
    for (let data of param) {

        try {
            let sql = await getInsertSqlStr(pool, data, dbName);
            await pool.query(sql);
        } catch (e) {
            return {
                code: 0,
                error: JSON.stringify(e),
                isSucess: false
            }
        }
    }
    return {
        code: 1,
        isSucess: true
    }
}

const generateRandomString = (length) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

module.exports = {
    readFile,
    parseHttpRequest,
    saveInDB,
    generateRandomString
}