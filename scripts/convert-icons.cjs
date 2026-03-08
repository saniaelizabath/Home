const sharp = require('sharp');
const path = require('path');

const inputImagePath = path.join(__dirname, '../public/logoimg.jpeg');
const output192Path = path.join(__dirname, '../public/logo192.png');
const output512Path = path.join(__dirname, '../public/logo512.png');

async function convertIcons() {
    try {
        await sharp(inputImagePath).resize(192, 192).toFile(output192Path);
        console.log('Created logo192.png');

        await sharp(inputImagePath).resize(512, 512).toFile(output512Path);
        console.log('Created logo512.png');
    } catch (err) {
        console.error('Error generating icons:', err);
    }
}

convertIcons();
