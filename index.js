const path = require('path');
const fs = require('fs');

module.exports = class CopyFillWebpackPlugin {
    constructor(patterns = [], options = {}) {
        if (!Array.isArray(patterns)) {
            throw new Error('[copy-fill-webpack-plugin] patterns must be an array');
        }

        this.patterns = patterns;
        this.options = options;
    };

    apply(compiler) {
        let context;

        if (!this.options.context) {
            ({context} = compiler.options);
        } else if (!path.isAbsolute(this.options.context)) {
            context = path.join(compiler.options.context, this.options.context);
        } else {
            ({context} = this.options);
        }

        let output = compiler.options.output.path;
        if (
            output === '/' &&
            compiler.options.devServer &&
            compiler.options.devServer.outputPath
        ) {
            output = compiler.options.devServer.outputPath;
        }


        compiler.hooks.emit.tap('CopyFillWebpackPlugin', compilation => {
            let ablePatterns = [];
            this.patterns.forEach(pattern => {
                if(pattern.from && pattern.to){
                    let absoluteFrom = '';
                    if(path.isAbsolute(pattern.from)){
                        absoluteFrom = pattern.from;
                    }else{
                        absoluteFrom = path.resolve(context, pattern.from);
                    }
                    ablePatterns.push(Object.assign({}, pattern, {
                        from: absoluteFrom,
                        position: pattern.position || 'ending'
                    }))

                }
            });

            ablePatterns.forEach(pattern => {
                let sourceId = pattern.source || pattern.to;
                let source = compilation.assets[sourceId] && compilation.assets[sourceId].source() || '';
                try{
                    let fromContent = fs.readFileSync(pattern.from, 'utf8');
                    let fileContent = '';
                    switch(pattern.position){
                        case 'start':
                            fileContent = fromContent + source;
                            break;

                        case 'ending':
                            fileContent = source + fromContent;
                            break;
                    }

                    compilation.assets[pattern.to] = {
                        source: () => {
                            return fileContent;
                        },
                        size: () => {
                            return Buffer.byteLength(fileContent, 'utf8');
                        }
                    };
                }catch(e){
                    console.log(e)
                }

            });
        })
    }
}
