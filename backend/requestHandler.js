const { login, checkIdentity, signup, emailVertify, getUserInfo, update } = require('./memberService'); // 引入项目数据、用户数据和身份验证的服务模块
const { addStaff, allStaff, deleteStaff } = require('./staffService'); // 引入项目数据、用户数据和身份验证的服务模块
const { addTea } = require('./resourceService'); // 引入项目数据、用户数据和身份验证的服务模块
const fs = require('fs');
const { parseMultipartData, sendResponse } = require('./utility'); // 引入状态码定义函数

// 处理 HTTP 请求的主函数
function handleRequest(req, res) {
    // 允许的跨域来源列表，指定可以访问的前端来源
    const allowOrigin = [
        'https://192.168.1.109', // 局域网开发环境
        'https://192.168.1.75',   // 局域网开发环境
        'https://www.lucaslyu.com',   // 生产环境的域名 (HTTPS)
        'https://lucaslyu.com'        // 简化域名 (HTTPS)
    ];

    // 获取请求来源的 origin，进行跨域检测
    const origin = req.headers.origin;
    if (allowOrigin.includes(origin)) {
        // 如果来源在允许的列表中，设置 CORS 响应头，允许跨域访问
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // 如果来源不在允许的列表中，不设置 CORS 响应头，不允许跨域访问
        res.setHeader('Access-Control-Allow-Origin', '*');

    }

    // 设置允许的 HTTP 方法和自定义头字段
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('请求方法:', req.method, '请求路径:', req.url);

    if (req.method === 'OPTIONS') {
        sendResponse(res, 204, 1); // 返回 204 No Content 状态码
        return;
    }

    if (req.method === 'POST' && req.url === '/') {
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('multipart/form-data')) {
            const boundary = contentType.split('boundary=')[1];
            parseMultipartData(req, boundary, (error, requestData) => {
                if (error) {
                    console.error('解析错误:', error);
                    sendResponse(res, 400, 3);
                    return;
                }
                console.log('收到的 multipart 数据:', requestData);
                dealingWithRequest(req, res, requestData);
            });
        } else if (contentType.includes('application/json')) {
            let body = '';
            req.on('data', (chunk) => (body += chunk.toString()));
            req.on('end', () => {
                try {
                    const requestData = JSON.parse(body);
                    console.log('收到的 JSON 数据:', requestData);
                    dealingWithRequest(req, res, requestData);
                } catch (error) {
                    console.error('JSON 解析错误:', error);
                    sendResponse(res, 400, 4);
                }
            });
        } else {
            sendResponse(res, 415, 1);
        }
    } else {
        sendResponse(res, 404, 1); // 返回 404 Not Found 状态码
    }
}

async function dealingWithRequest(req, res, requestData) {
    dealingWithFlagRequest(req, res, requestData);
    if (res.headersSent) return;
    if (requestData.action === 'checkIdentity') await checkIdentity(req, res);
    else if (requestData.action === 'getUserInfo') await getUserInfo(req, res);
    else if (requestData.action === 'update') await update(res, requestData);
    else if (requestData.action === 'login') await login(res, requestData);
    else if (requestData.action === 'signup') await signup(res, requestData);
    else if (requestData.action === 'emailVertify') await emailVertify(res, requestData);
    else sendResponse(res, 400, 1); 
}

async function dealingWithFlagRequest(req, res, requestData) {
    if (!requestData.fields) return;
    if (!requestData.fields.flag) return;
    const flag = requestData.fields.flag.toLowerCase(); 
    if (flag === 'staff') await dealingWithStaffRequest(req, res, requestData);
    else if (flag === 'tea') await dealingWithTeaRequest(req, res, requestData);
    else console.log('未知的 flag:', flag);
}


async function dealingWithStaffRequest(req, res, requestData) {
    if (requestData.fields.action === 'addStaff') await addStaff(req, res, requestData);
    else if (requestData.fields.action === 'deleteStaff') await deleteStaff(req, res, requestData);
    else if (requestData.fields.action === '/AllStaff') await allStaff(req, res, requestData);
    else console.log('no such staff action');
}

async function dealingWithTeaRequest(req, res, requestData) {
    if (requestData.fields.action === 'addTea') await addTea(req, res, requestData);
    else console.log('no such Tea action');
}

module.exports = { handleRequest };

