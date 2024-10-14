const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendResponse } = require('./utility');
const { verifyToken } = require('./memberService');
const { getConfig, loadConfig } = require('./init');

loadConfig();
const config = getConfig();
const SECRET_KEY = config.SECRET_KEY;

// 确保目录存在
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// 删除文件（用于错误处理）
function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

async function addStaff(req, res, requestData) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return sendResponse(res, 401, 1);
    }

    const token = authHeader.split(' ')[1];
    const verified = verifyToken(token, SECRET_KEY);
    if (!verified) {
        return sendResponse(res, 403, 1);
    }

    try {
        const { name, position, description, startDate } = requestData.fields;
        const imageFile = requestData.files.image;

        // 检查必填字段
        if (!name || !position || !description || !startDate || !imageFile) {
            return sendResponse(res, 400, 2);
        }

        // 读取现有员工数据
        const staffFilePath = path.join(__dirname, '../server/data/resources/staff/staff.json');
        ensureDirectoryExists(path.dirname(staffFilePath));

        let staffList = {};
        if (fs.existsSync(staffFilePath)) {
            const existingData = fs.readFileSync(staffFilePath, 'utf-8');
            staffList = JSON.parse(existingData || '{}');
        }

        const existingStaff = Object.values(staffList).find((staff) => staff.name === name);
        if (existingStaff) {
            return sendResponse(res, 409, 3); 
        }

        const imageUUID = `${uuidv4()}${path.extname(imageFile.filename)}`;
        const imagePath = path.join(__dirname, '../server/data/images/staff', imageUUID);
        ensureDirectoryExists(path.dirname(imagePath));
        fs.writeFileSync(imagePath, imageFile.data);

        const staffID = uuidv4();
        const staffInfo = {
            name,
            position,
            description,
            startDate,
            imagePath,
        };
        staffList[staffID] = staffInfo;

        // 写入更新后的员工列表
        fs.writeFileSync(staffFilePath, JSON.stringify(staffList, null, 2), 'utf-8');
        sendResponse(res, 200, 7); // 成功响应
    } catch (error) {
        console.error('添加员工时出错:', error);
        if (imagePath) deleteFile(imagePath);

        sendResponse(res, 500, 1); // 服务器错误
    }
}

module.exports = { addStaff };
