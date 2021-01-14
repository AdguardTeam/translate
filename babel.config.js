module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { browsers: 'defaults', node: 10 } }],
        '@babel/preset-typescript'
    ],
    "plugins": ["@babel/plugin-proposal-class-properties"]
};
