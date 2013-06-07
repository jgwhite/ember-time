App = Ember.Application.create();

App.Router.map(function() {
  this.route('clock');
});

App.ApplicationController = Ember.Controller.extend({
  createdAt: new Date()
});

App.ClockController = Ember.Controller.extend({
  createdAt: new Date()
});

App.FromNowView = Ember.View.extend({
  tagName: 'time',

  template: Ember.Handlebars.compile('{{view.output}}'),

  output: function() {
    return moment(this.get('value')).fromNow();
  }.property('value'),

  didInsertElement: function() {
    this.tick();
  },

  tick: function() {
    var nextTick = Ember.run.later(this, function() {
      console.log('tick');
      this.notifyPropertyChange('value');
      this.tick();
    }, 1000);
    this.set('nextTick', nextTick);
  },

  willDestroyElement: function() {
    var nextTick = this.get('nextTick');
    Ember.run.cancel(nextTick);
  }
});

Ember.Handlebars.helper('fromNow', App.FromNowView);
