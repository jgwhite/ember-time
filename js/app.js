App = Ember.Application.create();

App.Router.map(function() {
  this.route('clock');
  this.route('about');
});

App.IndexRoute = Ember.Route.extend({
  redirect: function() {
    this.transitionTo('clock');
  }
});

App.TimeView = Ember.View.extend({
  tagName: 'time',
  template: Em.Handlebars.compile('{{view.time}}'),

  time: function() {
    return moment().format('HH:mm:ss');
  }.property(),

  didInsertElement: function() {
    this.tick();
  },

  tick: function() {
    var nextTick = Ember.run.later(this, function() {
      console.log('tick');
      this.notifyPropertyChange('time');
      this.tick();
    }, 1000);

    this.set('nextTick', nextTick);
  },

  willDestroyElement: function() {
    var nextTick = this.get('nextTick');
    Ember.run.cancel(nextTick);
  }

});

Em.Handlebars.helper('time', App.TimeView);
