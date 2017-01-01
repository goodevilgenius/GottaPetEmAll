/* global $, firebase, Handlebars */

var PET = {

    // Initialize variables
    user: {},
    requests: {},
    templates: {},
    allDogs: [],
    groups: [],
    group: {},

    // Called to initialize the app
    init: function() {
        var that = this;

        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyCwtB3iIrowIviVeQTuqHaSxp-a3zst-fs",
            authDomain: "gottapetemall-ed801.firebaseapp.com",
            databaseURL: "https://gottapetemall-ed801.firebaseio.com",
            storageBucket: "gottapetemall-ed801.appspot.com",
            messagingSenderId: "548405008183"
        };
        firebase.initializeApp(config);

        // Compile template(s)
        $('script[type="text/x-handlebars-template"]').each(function(temp){
            var name = $(this).attr('id').replace(/-template$/, '');
            that.templates[name] = Handlebars.compile($(this).html());
        });

        // Add listener for groups
        $('#groups').on('click', 'li', function(evt){
            var group = $(this).text();
            var slug = that.getSlug(group);
            console.log(that.group[slug]);
            that.displayDogs(that.group[slug]);
        });

        // Start by authenticating
        this.auth();
    },
    
    auth: function() {
        var that = this;
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                that.user = user;
                that.displayApp();
            } else {
                // No user is signed in.
                that.displayLogin();
            }
        });
    },

    // Fetch data and display checklist
    // This is the main part of the app
    displayApp: function() {
        var that = this;
        
        var doRequests = function(name) {
            that.requests[name] = $.ajax('/assets/json/' + name + '.json');
            that.requests[name].done(function(data) {
                console.log('Showing ' + name);
                that.generateTemplate(name, data);
            });
            return that.requests[name];
        };

        console.log('Display app');
        doRequests('breeds').done(function(data){
            that.allDogs = data;
        });
        doRequests('groups').done(function(data){
            that.groups = data;
            that.requests.group = {};
            data.forEach(function(group) {
                var slug = that.getSlug(group);
                that.requests.group[slug] = 
                    $.ajax('/assets/json/groups/' + slug + '.json');

                that.requests.group[slug].done(function(data){
                    that.group[slug] =  data;
                });
            });
        });
    },

    displayLogin: function() {
        console.log("Need to log in");
    },

    generateTemplate: function(name, data) {
        var context = {};
        context[name] = data;

        var generate = this.templates[name](context);
        $('#' + name).html(generate);
    },

    displayDogs: function(dogs) {
        this.generateTemplate('breeds', dogs);
    },

    getSlug: function(name) {
        return name.toLowerCase().replace(/ +/g, '-');
    },
};

PET.init();
