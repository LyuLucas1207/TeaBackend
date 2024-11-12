const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendResponse } = require('./utility');
const { verifyToken } = require('./memberService');
const { getConfig, loadConfig } = require('./init');
const { console } = require('inspector');

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

async function allTea(req, res) {
    // const authHeader = req.headers['authorization'];
    // if (!authHeader) {
    //     return sendResponse(res, 401, 1);
    // }

    // const token = authHeader.split(' ')[1];
    // const verified = verifyToken(token, SECRET_KEY);
    // if (!verified) {
    //     return sendResponse(res, 403, 1);
    // }

    try {
        const teaDirectoryPath = path.join(__dirname, '../server/data/resources/tea');
        let allTeaData = {};

        // Function to recursively read subdirectories
        function readDirectory(dirPath) {
            const filesAndDirs = fs.readdirSync(dirPath);

            filesAndDirs.forEach(fileOrDir => {
                const fullPath = path.join(dirPath, fileOrDir);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Recursively read the subdirectory
                    readDirectory(fullPath);
                } else if (fileOrDir === 'tea.json') {
                    // Read and parse the tea.json file
                    const teaData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

                    // Merge the tea data into the result object
                    Object.keys(teaData).forEach((id) => {
                        const tea = teaData[id];
                        allTeaData[id] = {
                            ...tea,
                            imageUrl: `/images/tea/${tea.category}_tea/${path.basename(tea.imagePath)}`
                        };
                    });
                }
            });
        }
        readDirectory(teaDirectoryPath);// Start reading from the main tea directory
        sendResponse(res, 200, 8, headers, allTeaData);
    } catch (error) {
        console.error('获取茶叶时出错:', error);
        sendResponse(res, 500, 1); // 服务器错误
    }
}

const teaMap = {
    // 'GreenTea': 'GreenTea_tea',
    'RedTea': 'RedTea_tea',
    'WhiteTea': 'WhiteTea_tea',
    // 'YellowTea': 'YellowTea_tea',
    // 'OolongTea': 'OolongTea_tea',
    'DarkTea': 'DarkTea_tea',

    // 'Longjing': '/GreenTea_tea/Longjing_tea',
    // 'Biluochun': '/GreenTea_tea/Biluochun_tea',
    // 'Maofeng': '/GreenTea_tea/Maofeng_tea',

    // 'Anhua': '/DarkTea_tea/Anhua_tea',
    // 'Liubao': '/DarkTea_tea/Liubao_tea',
    // 'Puerh': '/DarkTea_tea/Puerh_tea',

    // 'Dahongpao': '/OolongTea_tea/Dahongpao_tea',
    // 'Shuixian': '/OolongTea_tea/Shuixian_tea',
    // 'Tieguanyin': '/OolongTea_tea/Tieguanyin_tea',

    // 'Dianhong': '/RedTea_tea/Dianhong_tea',
    // 'Keemun': '/RedTea_tea/Keemun_tea',
    // "Lapsang": '/RedTea_tea/Lapsang_tea',

    // 'Shoumei': '/WhiteTea_tea/Shoumei_tea',
    // 'SilverNeedle': '/WhiteTea_tea/SilverNeedle_tea',
    // 'WhitePeony': '/WhiteTea_tea/WhitePeony_tea',

    // 'Junshan': '/YellowTea_tea/Junshan_tea',
    // 'Huangshan': '/YellowTea_tea/Huangshan_tea',
    // 'Mogan': '/YellowTea_tea/Mogan_tea',

    'Gushu_red': '/RedTea_tea/Gushu_red_tea',
    'Gushu_white': '/WhiteTea_tea/Gushu_white_tea',
    'Puerh_raw': '/DarkTea_tea/Puerh_raw_tea',
    'Puerh_ripe': '/DarkTea_tea/Puerh_ripe_tea',
    'None': 'None_tea'


}


//fields: { action: '/GetTea', flag: 'tea', name: 'Longjing' }
async function getTea(req, res, requestData) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return sendResponse(res, 401, 1);
    }

    // const token = authHeader.split(' ')[1];
    // const verified = verifyToken(token, SECRET_KEY);
    // if (!verified) {
    //     return sendResponse(res, 403, 1);
    // }
    const name = requestData.fields.name;
    if (!name) {
        return sendResponse(res, 400, 2);
    }

    try {
        const real_name = teaMap[name];
        if (real_name === 'None_tea') {
            return sendResponse(res, 404, 1);
        }

        if (!real_name) {
            return sendResponse(res, 404, 1);
        }
        const teaDirectoryPath = path.join(__dirname, '../server/data/resources/tea', real_name);
        let allTeaData = {};

        // Function to recursively read subdirectories
        function readDirectory(dirPath) {
            const filesAndDirs = fs.readdirSync(dirPath);

            filesAndDirs.forEach(fileOrDir => {
                const fullPath = path.join(dirPath, fileOrDir);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Recursively read the subdirectory
                    readDirectory(fullPath);
                } else if (fileOrDir === 'tea.json') {
                    // Read and parse the tea.json file
                    const teaData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

                    // Merge the tea data into the result object
                    Object.keys(teaData).forEach((id) => {
                        const tea = teaData[id];
                        allTeaData[id] = {
                            ...tea,
                            imageUrl: `/images/tea/${tea.category}_tea/${path.basename(tea.imagePath)}`
                        };
                    });
                }
            });
        }
        readDirectory(teaDirectoryPath);// Start reading from the main tea directory
        sendResponse(res, 200, 8, headers, allTeaData);
    } catch (error) {
        console.error('获取茶叶时出错:', error);
        sendResponse(res, 500, 1); // 服务器错误
    }
}
async function deleteTea(req, res, requestData) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return sendResponse(res, 401, 1);
    }

    const token = authHeader.split(' ')[1];
    const verified = verifyToken(token, SECRET_KEY);
    if (!verified) {
        return sendResponse(res, 403, 1);
    }

    const { category, subcategory, id } = requestData.fields;
    if (!category || !subcategory || !id) {
        return sendResponse(res, 400, 2);  // 缺少必要参数
    }

    try {
        // 构造文件路径
        const TeaFilePath = path.join(__dirname, '../server/data/resources/tea', `${category}_tea`, `${subcategory}_tea`, 'tea.json');

        // 检查文件是否存在
        if (!fs.existsSync(TeaFilePath)) {
            console.log(`File not found: ${TeaFilePath}`);
            return sendResponse(res, 404, 1);
        }

        // 读取并解析茶叶数据
        const teaData = JSON.parse(fs.readFileSync(TeaFilePath, 'utf-8'));  // 修正: 解析 JSON 数据
        const tea = teaData[id];
        if (!tea) {
            console.log(`Tea with ID ${id} not found`);
            return sendResponse(res, 404, 1);  // 茶叶数据未找到
        }

        // 删除茶叶图片
        const imagePath = path.join(__dirname, '..', tea.imagePath);
        console.log('删除茶叶图片:', imagePath);
        deleteFile(imagePath);

        // 删除茶叶数据
        delete teaData[id];
        fs.writeFileSync(TeaFilePath, JSON.stringify(teaData, null, 2), 'utf-8');  // 修正: 写入更新后的 JSON

        sendResponse(res, 200, 10);  // 成功删除茶叶
    } catch (error) {
        console.error('删除茶叶时出错:', error);
        sendResponse(res, 500, 1);  // 返回服务器错误
    }
}

module.exports = { addTea, allTea, getTea, deleteTea };
