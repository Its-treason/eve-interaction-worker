module.exports = {
    apps : [{
        name: 'eve-util',
        cwd: './',
        script: './index.js',
        env: {
            NODE_ENV: 'production',
            DISCORD_TOKEN: 'someone-forgot-to-change-this-value',
        },
    }],
};
