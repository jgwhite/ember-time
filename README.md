# Ember Time Example

This is a very simple example of creating a view in Ember that periodically
updates. Useful for components such as clocks.

First up, in the template for the `clock` route we use the time helper:

```handlebars
The time is {{time}}
```

This helper renders an instance of `App.TimeView` thanks to
`Ember.Handlebars.helper`:

```javascript
Ember.Handlebars.helper('time', App.TimeView);
```

Our naïve time view just renders it’s own time propery, in reality we
would want to generalise this:

```javascript
App.TimeView = Ember.View.extend({
  tagName: 'time',
  template: Ember.Handlebars.compile('{{view.time}}'),
  time: function() {
    return moment().format('HH:mm:ss');
  }.property()
});
```

Note that Ember views try not to get in the way of the surrounding context.
This is why we must refer to `view.time` in the template.

Now how do we get this view to periodically re-render?

We need some kinda of tick function that gets run every second. How about this:

```javascript
App.TimeView = Ember.View.extend({
  // ...

  tick: function() {
    var nextTick = Ember.run.later(this, function() {
      // Trigger redraw somehow...
      this.tick();
    }, 1000);

    this.set('nextTick', nextTick);
  }

});
```
