const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendResponse } = require('./utility');
const { verifyToken } = require('./memberService');
const { getConfig, loadConfig } = require('./init');

loadConfig();
const config = getConfig();
const SECRET_KEY = config.SECRET_KEY;
const headers = config.headers;

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
        const staffFilePath = path.join( './server/data/resources/staff/staff.json');
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
        const imagePath = path.join( './server/data/images/staff', imageUUID);
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

async function allStaff(req, res) {
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
        const staffFilePath = path.join(__dirname, '../server/data/resources/staff/staff.json');

        if (!fs.existsSync(staffFilePath)) {
            return sendResponse(res, 404, 1); // 如果文件不存在，返回 404
        }

        const staffData = fs.readFileSync(staffFilePath, 'utf-8');
        const staffList = JSON.parse(staffData || '{}');

        // 遍历员工数据，为每个员工添加图片 URL
        const staffWithImageUrls = {};
        for (const [id, staff] of Object.entries(staffList)) {
            staffWithImageUrls[id] = {
                ...staff,
                imageUrl: `/images/staff/${path.basename(staff.imagePath)}` // 生成图片 URL
            };
        }

        // 发送 JSON 响应
        sendResponse(res, 200, 8, headers, staffWithImageUrls);
    } catch (error) {
        console.error('获取员工列表时出错:', error);
        sendResponse(res, 500, 1); // 返回服务器错误
    }
}


async function deleteStaff(req, res, requestData) {
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
        const { id } = requestData.fields;

        // 检查 ID 是否存在
        if (!id) {
            return sendResponse(res, 400, 5, headers);
        }

        // 读取现有员工数据
        const staffFilePath = path.join(__dirname, '../server/data/resources/staff/staff.json');
        if (!fs.existsSync(staffFilePath)) {
            return sendResponse(res, 404, 1, headers);
        }

        const staffData = JSON.parse(fs.readFileSync(staffFilePath, 'utf-8'));

        // 根据 ID 查找员工
        const staff = staffData[id];
        if (!staff) {
            return sendResponse(res, 404, 1, {}, { msg: '找不到对应的员工信息' });
        }

        // 删除员工的图片文件
        const imagePath = path.join(__dirname, '..', staff.imagePath);
        console.log('删除员工图片:', imagePath);
        deleteFile(imagePath);

        // 从员工列表中删除该员工
        delete staffData[id];

        // 将更新后的员工数据写回文件
        fs.writeFileSync(staffFilePath, JSON.stringify(staffData, null, 2), 'utf-8');

        // 返回成功响应
        sendResponse(res, 200, 9, headers);
    } catch (error) {
        console.error('删除员工时出错:', error);
        sendResponse(res, 500, 1, headers);
    }
}


module.exports = { addStaff, allStaff, deleteStaff };
