const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const userAgents = require('../config/userAgents');


class Downloader {
    constructor(config) {
        this.config = config;
        this.userAgents = userAgents;
        this.currentUserAgentIndex = 0;
    }

    getNextUserAgent() {
        this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
        return this.userAgents[this.currentUserAgentIndex];
    }

    async downloadAPK(version, apkUrl) {
        try {
            const folder = this.config[version].apkFolder;
            await fs.ensureDir(folder);
    
            const fileName = `dokkan_${version.toLowerCase()}_${Date.now()}.apk`;
            const filePath = path.join(folder, fileName);
    
            const response = await axios({
                method: 'GET',
                url: apkUrl,
                responseType: 'stream',
                headers: this.headers,
                onDownloadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    process.stdout.write(`\rDownloading ${version}: ${progress}%`);
                }
            });
    
            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;
    
            const writer = fs.createWriteStream(filePath);
            
            response.data.on('data', (chunk) => {
                downloadedSize += chunk.length;
                const progress = Math.round((downloadedSize / totalSize) * 100);
                process.stdout.write(`\rDownloading ${version}: ${progress}%`);
            });
    
            response.data.pipe(writer);
            await this.validateFile(filePath);
    
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    process.stdout.write('\n');
                    resolve(filePath);
                });
                writer.on('error', reject);
            });
        } catch (error) {
            console.error(`Error downloading APK: ${error.message}`);
            throw error;
        }
    }

    async findApkDownloadUrl(version) {
        try {
            const packageId = this.config[version].packageId;
            
            this.headers = {
                'User-Agent': this.getNextUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            };

            await this.delay(Math.random() * 3000 + 2000); 

            const mainUrl = `https://apkpure.com/dokkan-battle/${packageId}`;
            const mainResponse = await axios.get(mainUrl, {
                headers: this.headers
            });

            const cookies = mainResponse.headers['set-cookie'];
            if (cookies) {
                this.headers.Cookie = cookies.map(cookie => cookie.split(';')[0]).join('; ');
            }

            await this.delay(Math.random() * 2000 + 1000);

            const directUrl = `https://d.apkpure.com/b/APK/${packageId}?version=latest`;
            this.headers.Referer = mainUrl;

            await axios.head(directUrl, {
                headers: this.headers
            });

            return directUrl;
        } catch (error) {
            console.error(`Error finding APK download URL: ${error.message}`);
            throw error;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async validateFile(filePath) {
    try {
        const stats = await fs.stat(filePath);
        if (stats.size < 50 * 1024 * 1024) {
            throw new Error('Downloaded file is too small to be valid');
        }
        return true;
    } catch (error) {
        await fs.remove(filePath); 
        throw error;
    }
}
    
}

module.exports = Downloader;