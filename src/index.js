const VersionChecker = require('./services/versionChecker');
const Downloader = require('./services/downloader');
const config = require('./config/config');

async function main() {
    const versionChecker = new VersionChecker(config);
    const downloader = new Downloader(config);

    const versions = ['GLOBAL', 'JP'];

    for (const version of versions) {
        try {
            console.log(`Checking ${version} version...`);
            
            const needsUpdate = await versionChecker.needsUpdate(version);
            
            if (needsUpdate) {
                console.log(`Update needed for ${version}`);
                const filePath = await downloadWithRetry(version, downloader);
                console.log(`Downloaded ${version} APK to ${filePath}`);
            } else {
                console.log(`${version} is up to date`);
            }
        } catch (error) {
            console.error(`Error processing ${version}: ${error.message}`);
        }
    }
}

async function downloadWithRetry(version, downloader, maxRetries = 3, initialDelay = 10000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const downloadUrl = await downloader.findApkDownloadUrl(version);
            return await downloader.downloadAPK(version, downloadUrl);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = initialDelay * Math.pow(2, i); // Exponential backoff
            console.log(`Attempt ${i + 1} failed, retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

main().catch(console.error);