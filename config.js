let globalConfig = {
    subdomain: ''
};

module.exports = {
    getSubdomain: () => globalConfig.subdomain,
    setSubdomain: (subdomain) => { globalConfig.subdomain = subdomain; }
};
