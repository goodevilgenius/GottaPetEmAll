/* global $, firebase, Handlebars */

var PET = {
    
    user: {},
    requests: {},
    templates: {},
    allDogs: [],

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

        // Start by authenticating
        this.auth();
    },
    
    auth: function() {
        var that = this;
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                that.user = user;
                that.displayDogs();
            } else {
                // No user is signed in.
                that.displayLogin();
            }
        });
    },

    displayDogs: function() {
        var that = this;
        
        var doRequests = function(name) {
            that.requests[name] = $.ajax('/assets/json/' + name + '.json');
            that.requests[name].done(function(data) {
                console.log('Showing ' + name);
                switch (name) {
                    case 'breeds':
                        that.allDogs = data;
                        break;
                    case 'groups':
                        that.groups = data;
                }
                var context = {};
                context[name] = data;

                var generate = that.templates[name](context);
                $('#' + name).html(generate);
            });
        };

        console.log('Display dogs');
        doRequests('breeds');
        doRequests('groups');
        // this.breedsRequest = $.ajax('/assets/json/breeds.json');
        // this.breedsRequest.done(function(data){
        //     console.log('Showing dogs');
        //     that.allDogs = data;
        //     var dogList = that.templates.dogs({dogs:data});
        //     $('#dogs').html(dogList);
        // });
        
        // this.groupsRequest = $.ajax('/assets/json/groups.json');
    },

    displayLogin: function() {
        console.log("Need to log in");
    },
};

PET.init();