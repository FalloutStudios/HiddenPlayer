const Yml = require('yaml');
const Version = require('./version');
const Commander = require('commander');
const { ask } = require('fallout-utility');
const MakeConfig = require('./makeConfig');

module.exports = class {
    constructor(location) {
        this.location = location;
        this.language = null;
    }

    parse() {
        if(!this.location || this.location == null) throw new Error("No language location specified");

        const language = Yml.parse(MakeConfig(this.location, generateLang()));
        
        if(language.version != Version) throw new Error("Unsupported language version. Version:" + language.version + "; Supported: " + Version);
        this.language = language;
        
        return this;
    }

    getLanguage() {
        return this.language;
    }
}

function generateLang() {
    return {
        version: Version
    };
}