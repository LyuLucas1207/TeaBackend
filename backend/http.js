const https = require('https'); // 使用 https 模块
const { handleRequest } = require('./requestHandler'); // 引入请求处理模块
const fs = require('fs');
const path = require('path');
// 服务器端口
const port = 10002;

// 加载 SSL 证书和密钥
const options = {
    // key: fs.readFileSync('/volume2/ProJData/PersonalData/ssl.key'), // SSL 私钥文件路径
    // cert: fs.readFileSync('/volume2/ProJData/PersonalData/ssl.crt') // SSL 证书文件路径
    key: fs.readFileSync('./ssl.key'), // SSL 私钥文件路径
    cert: fs.readFileSync('./ssl.crt') // SSL 证书文件路径
};

// 根据文件扩展名返回适当的 Content-Type
function getContentType(ext) {
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}

// 创建 HTTPS 服务器，并使用请求处理模块
const server = https.createServer(options, (req, res) => {
    // 解析请求路径
    const url = new URL(req.url, `https://${req.headers.host}`);

    // 静态资源请求处理
    if (url.pathname.startsWith('/images/')) {
        const filePath = path.join(__dirname, '../server/data', url.pathname); // 获取文件路径

        // 检查文件是否存在
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }

            // 设置正确的 Content-Type
            const ext = path.extname(filePath).toLowerCase();
            const contentType = getContentType(ext);

            // 读取并返回文件
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        });
    } else {
        // 非静态资源请求交给 handleRequest 处理
        handleRequest(req, res);
    }
});
// const server = https.createServer(options, handleRequest);


server.listen(port, () => {
    console.log(`服务器运行在 https://localhost:${port}`);
});






