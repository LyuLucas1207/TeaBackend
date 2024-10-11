const fs = require('fs');
const path = require('path');

let config = {};

function loadConfig() {
    const configPath = path.join(__dirname, './config/server.json'); // 配置文件路径
    try {
        const data = fs.readFileSync(configPath, 'utf8'); // 读取 JSON 文件
        config = JSON.parse(data); // 解析 JSON
    } catch (err) {
        console.error('加载配置文件时出错:', err);
    }
}

function getConfig() {
    return config;
}

module.exports = {
    loadConfig,
    getConfig
};
