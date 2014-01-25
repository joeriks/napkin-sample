module.exports = function (grunt) {

    grunt.initConfig({
        watch: {
            files: '*.txt',
            tasks: ['napkin'],
            options: {
                spawn: false,
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');

    var napkin = require("./napkin");
    require("./napkin-generator-cs");
    require("./napkin-generator-text");
    
    var changedFiles = [];
    grunt.event.on('watch', function(action, filepath) {
        console.log("File " + filepath + " " + action);
        changedFiles.push({file:filepath, action:action});
    });

    grunt.registerTask('napkin', function () {

        if (changedFiles){

            for(var i = changedFiles.length - 1; i >= 0; i--) {
                
                var filename = changedFiles[i].file;
                napkin.parseFile(filename, true);
                changedFiles.splice(i, 1);
            }

        }

    });
    grunt.registerTask('default', ['napkin', 'watch']);


};