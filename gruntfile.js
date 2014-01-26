module.exports = function (grunt) {

    grunt.initConfig({
        watch: {           
            grunt: {files:'*.js'},
            files: '*.txt',
            tasks: ['napkin'],
            options: {
                spawn: false,
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');

    var napkin;
    
    
    function requireUncached(module){
        delete require.cache[require.resolve(module)]
        return require(module)
    }

    function reloadNapkinAndModules() {
        
        napkin = requireUncached("./napkin");
        requireUncached("./napkin-generator-cs");
        requireUncached("./napkin-generator-text");
        requireUncached("./napkin-generator-html");
    }

    reloadNapkinAndModules();

    var changedFiles = [];

    grunt.event.on('watch', function(action, filepath) {
        if (filepath.indexOf(".txt")!=-1) {

            if (changedFiles.filter(function(item) {return item.file==filepath}).length==0) {
                changedFiles.push({file:filepath, action:action});
            }

        }
        if (filepath.indexOf(".js")!=-1) {
            reloadNapkinAndModules();
            grunt.task.run('napkin');
        }
    });

    grunt.registerTask('napkin', function () {
        console.log("napkin task");
        console.log(changedFiles);

        if (changedFiles){

            var errors = [];

            for(var i = changedFiles.length - 1; i >= 0; i--) {
                
                var filename = changedFiles[i].file;
                console.log("Parsing " + filename);
                var result = napkin.parseFile(filename, true);

                if (result instanceof Error) {
                    errors.push(filename);
                }

                //changedFiles.splice(i, 1);
            }

            if (errors.length>0) throw new Error("Could not parse " + errors.join(", "));

        }

    });
    grunt.registerTask('default', ['napkin', 'watch']);


};



