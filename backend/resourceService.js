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

async function addTea(req, res, requestData) {
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
        const { name, category, subcategory, description, price, quantity } = requestData.fields;
        const imageFile = requestData.files.image;

        // 检查必填字段
        if (!name || !category || !subcategory || !description || !price || !quantity) {
            console.log("name:", name, "category:", category, "subcategory:", subcategory, "description:", description, "price:", price, "quantity:", quantity);
            return sendResponse(res, 400, 2);
        }

        // 确保主分类和子分类的文件夹存在
        const categoryFolder = path.join(`./server/data/resources/tea/${category}_tea`);
        const subcategoryFolder = path.join(categoryFolder, `${subcategory}_tea`);
        ensureDirectoryExists(subcategoryFolder);

        // 检查是否已经存在相同名字的茶叶
        const teaFilePath = path.join(subcategoryFolder, 'tea.json');
        let teaList = {};
        if (fs.existsSync(teaFilePath)) {
            const existingData = fs.readFileSync(teaFilePath, 'utf-8');
            teaList = JSON.parse(existingData || '{}');
        }

        const existingTea = Object.values(teaList).find((tea) => tea.name === name);
        if (existingTea) {
            return sendResponse(res, 409, 3); // 茶叶已存在
        }

        // 保存图片
        const imageUUID = `${uuidv4()}${path.extname(imageFile.filename)}`;
        const imagePath = path.join(`./server/data/images/tea/${category}_tea`, imageUUID);
        ensureDirectoryExists(path.dirname(imagePath));
        fs.writeFileSync(imagePath, imageFile.data);

        // 创建茶叶信息对象并生成 ID
        const teaID = uuidv4();
        const teaInfo = {
            name,
            category,
            subcategory,
            description,
            price,
            quantity,
            imagePath,
        };
        teaList[teaID] = teaInfo;

        // 写入更新后的茶叶信息
        fs.writeFileSync(teaFilePath, JSON.stringify(teaList, null, 2), 'utf-8');
        sendResponse(res, 200, 7); // 成功响应
    } catch (error) {
        console.error('添加茶叶时出错:', error);
        if (imagePath) deleteFile(imagePath); // 如果图片已保存但出错，删除图片
        sendResponse(res, 500, 1); // 服务器错误
    }
}

module.exports = { addTea };
