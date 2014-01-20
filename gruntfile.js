module.exports = function (grunt) {

    grunt.initConfig({
        watch: {
            files: 'sample.txt',
            tasks: ['napkin'],
            options: {
                spawn: false,
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');

    var napkin = require("./napkin");

    grunt.registerTask('napkin', function () {

        napkin.generate("sample.txt");

    });
    grunt.registerTask('default', ['napkin', 'watch']);


};