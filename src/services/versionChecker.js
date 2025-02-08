const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ApkParser = require('node-apk-parser');

class VersionChecker {
    constructor(config) {
        this.config = config;
    }

    async getCurrentVersion(version) {
        const folder = this.config[version].apkFolder;
        
        if (!fs.existsSync(folder)) {
            return null;
        }

        const files = fs.readdirSync(folder);
        const apkFiles = files.filter(file => file.endsWith('.apk'));
        
        if (apkFiles.length === 0) {
            return null;
        }

        const latestApk = apkFiles[apkFiles.length - 1];
        const reader = ApkParser.readFile(path.join(folder, latestApk));
        const manifest = reader.readManifest();
        
        return manifest.versionName;
    }

    async getLatestVersion(version) {
        try {
            const response = await axios.get(this.config[version].versionUrl);
            const versionMatch = response.data.match(/Current Version<\/div><span class="htlgb">([^<]+)</);
            
            if (versionMatch && versionMatch[1]) {
                return versionMatch[1].trim();
            }
            
            return null;
        } catch (error) {
            console.error(`Error checking version: ${error.message}`);
            return null;
        }
    }

    async needsUpdate(version) {
        const current = await this.getCurrentVersion(version);
        const latest = await this.getLatestVersion(version);

        if (!current || !latest) {
            return true;
        }

        return current !== latest;
    }
}

module.exports = VersionChecker;