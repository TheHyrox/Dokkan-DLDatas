const config = {
    GLOBAL: {
        packageId: 'com.bandainamcogames.dbzdokkanww',
        apkFolder: './apk/global',
        versionUrl: 'https://play.google.com/store/apps/details?id=com.bandainamcogames.dbzdokkanww',
        retryAttempts: 3,
        retryDelay: 5000
    },
    JP: {
        packageId: 'com.bandainamcogames.dbzdokkan',
        apkFolder: './apk/jp',
        versionUrl: 'https://play.google.com/store/apps/details?id=com.bandainamcogames.dbzdokkan',
        retryAttempts: 3,
        retryDelay: 5000
    }
};

module.exports = config;