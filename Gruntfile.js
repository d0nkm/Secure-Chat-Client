module.exports = function (grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		copy: {
			build: {
				src: ['**/*', '!public/**/*.jade', '!**/*~'],
				expand: true,
				cwd: 'src',
				dest: 'dist'
			}
		},

		jade: {
			build: {
				options: {
					doctype: 'html'
				},
				src: ['public/**/*.jade'],
				ext: '.html',
				expand: true,
				cwd: 'src',
				dest: 'dist'
			}
		},

		clean: {
			clean: ['dist']
		}
	});

	// grunt.loadNpmTask('grunt-contrib-');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jade');

	grunt.registerTask('default', ['copy', 'jade']);
};
