/* global $, firebase, Handlebars */

var PET = {

    // Initialize variables
    user: {},
    dbRef: null,
    requests: {},
    templates: {},
    allDogs: [],
    groups: [],
    group: {},
    pets: {},

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
        $('#groups').on('click', 'li', function(){
            var group = $(this).text();
            var slug = that.getSlug(group);
            that.displayDogs(that.group[slug]);
        });

        // Add listener for allDogs
        $('#allDogs').on('click', function(){
            that.displayDogs(that.allDogs);
        });

        // Add listener for dog
        $('#breeds').on('click', 'li', function() {
            var breed = $(this).attr('id');
            console.log('Incrementing ' + breed);

            that.incDecBreed(breed);
        });
        $('#breeds').on('click', 'li button', function(evt){
            evt.preventDefault();
            evt.stopPropagation();

            var which = $(this).attr('class');
            var breed = $(this).parent('li').attr('id');
            that.incDecBreed(breed, which);
        });

        // Register Handlebars helper(s)
        Handlebars.registerHelper('slug', this.getSlug);

        // Start by authenticating
        this.auth();
    },
    
    auth: function() {
        var that = this;
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                that.user = user;
                that.dbRef = firebase.database().ref(user.uid);
                that.dbRef.on('child_changed', that.changeData);
                that.dbRef.on('child_added', that.changeData);

                that.displayApp();
            } else {
                // No user is signed in.
                that.displayLogin();
            }
        });
    },

    incDecBreed: function(breed, which) {
        var count = this.pets[breed];
        if (count == undefined) count = 0;

        switch (which) {
            case 'down':
                if (count > 0) --count;
                break;
            default:
                ++count;
        }

        this.dbRef.child(breed).set(count);
        this.pets[breed] = count;

    },

    // Listener for firebase change
    changeData: function(snapshot) {
        // this refers to the dbref, not PET
        var breed = snapshot.key;
        var pets = snapshot.val();
        PET.pets[breed] = pets;

        $('#' + breed + ' .count').text(pets);
    },

    // Fetch data and display checklist
    // This is the main part of the app
    displayApp: function() {
        var that = this;
        
        var doRequests = function(name) {
            that.requests[name] = $.ajax('/assets/json/' + name + '.json');
            return that.requests[name];
        };

        console.log('Display app');
        doRequests('breeds').done(function(data){
            that.displayDogs(data);
            that.allDogs = data;
            $('#allDogs').prop('disabled', false);
        });
        doRequests('groups').done(function(data){
            that.generateTemplate('groups', data);
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
        var goog = new firebase.auth.GoogleAuthProvider();
        var fb = new firebase.auth.FacebookAuthProvider();

        $('#fb-login').data('prov', fb);
        $('#goog-login').data('prov', goog);

        $('#auth p').on('click', function(){
            var prov = $(this).data('prov');

            firebase.auth().signInWithPopup(prov).catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;

                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;

                console.log(error, errorCode, errorMessage, credential);
            });
        });
    },

    generateTemplate: function(name, data) {
        var context = {};
        context[name] = data;

        var generate = this.templates[name](context);
        $('#' + name).html(generate);
    },

    displayDogs: function(dogs) {
        var that = this;
        var dogsObjects = dogs.map(function(dog) {
            return {
                name: dog,
                count: that.pets[that.getSlug(dog)] || 0
            };
        });
        this.generateTemplate('breeds', dogsObjects);
    },

    getSlug: function(name) {
        return name.toLowerCase().replace(/ +/g, '-');
    },
};

PET.init();
