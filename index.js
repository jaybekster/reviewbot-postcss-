var fs = require("fs"),
    path = require('path'),
    stylelint = require("stylelint"),
    postcss = require("postcss"),
    stylintrc = {};

if (fs.existsSync('./.stylintrc')) {
    stylintrc = JSON.parse(fs.readFileSync('./.stylintrc', 'utf8'));
}

module.exports = function(config) {
    if (typeof config !== 'object') {
        config = {};
    }

    if (!Array.isArray(config.extensions)) {
        config.extensions = ['.css'];
    }

    return {
        type: 'postcss',
        review: function(files, done) {
            var log = {
                    success: true,
                    errors: []
                },
                promises = [];

            files.forEach(function(filePath) {

                if (config.extensions.indexOf(path.extname(filePath)) === -1) {
                    return;
                }

                var promise = new Promise(function(resolve, reject) {
                    fs.readFile(filePath, {
                        encoding: 'utf8'
                    }, function(err, fileData) {
                        if (err) {
                            throw err;
                        }

                        var fileName = path.join(__dirname, filePath);

                        postcss([
                            stylelint(stylintrc)
                        ]).process(fileData).then(function(result) {
                            result.messages.forEach(function(message) {
                                log.errors.push({
                                    filename: fileName,
                                    line: message.line,
                                    column: message.column,
                                    rule: message.rule,
                                    message: String(message.text).replace("\n", '')
                                });
                            });

                            resolve();
                        }).catch(function(error) {
                            log.errors.push({
                                filename: fileName,
                                line: error.line,
                                column: error.column,
                                message: String(error.reason).replace("\n", '')
                            })

                            resolve();
                        });
                    });
                });

                promises.push(promise);
            });

            Promise.all(promises).then(function() {
                if (log.errors.length) {
                    log.success = false;
                }
                done(log);
            });

        }

    }
}
