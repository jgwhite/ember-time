# Ember Period Execution Example

A friend recently asked about the best approach for implementing a
particular feature in Ember. They wanted to use moment.js to show createdAt
times in 'time ago' format -- and wanted them to update each minute.

This is a common feature, but it’s not covered in Ember’s guides and
appears to fall slightly outside of the golden path. So let’s try
implementing it, and hopefully we’ll get a chance to use some of the
lesser-known tools in Ember’s API.

First up, let’s figure out how we want to use this in our templates.
Let’s say we want a `fromNow` helper to match Moment’s API. Let’s add that
to our application template:

```html
<script type="text/x-handlebars">
  <p>Created {{fromNow valueBinding="createdAt"}}</p>
</script>
```

If we reload the page we get an error telling us that `fromNow` is not
defined anywhere. So let’s define it.

This timestamp is going to have continued behaviour for as long as it’s
displayed, so let’s give it a proper view class of its own. We probably
want it to use the `time` tag and render the result of running
Moment’s `fromNow` method on whatever it’s value is.

```javascript
App.FromNowView = Ember.View.extend({
  tagName: 'time',

  template: Ember.Handlebars.compile('{{view.output}}'),

  output: function() {
    return moment(this.get('value')).fromNow();
  }.property('value')
});
```

Note that we use `view.output` rather than simply `output`. This is
because Ember’s views try their best to get out of the way of the
surrounding context. If we want to access a property
of the view in it’s template, we need to be specific.

Now we’ve got our view class, Ember lets us register a shortcut
as follows:

```javascript
Ember.Handlebars.helper('fromNow', App.FromNowView);
```

If we refresh the page now, we’ll actually see the reasonable output
of 'Created a few seconds ago'. This is because our view’s value is
not defined and `moment(undefined)` creates a moment object for the
current time.

Let’s define `createdAt` so it’ll become the value of our view.

We’re rendering the view in the application template, which is backed
by the singleton instance of our `ApplicationController`, so let’s
set `createdAt` there:

```javascript
App.ApplicationController = Ember.Controller.extend({
  createdAt: new Date(2011, 3, 30)
});
```

Refreshing the page should show something like 'Created 2 years ago'.
This is great, but not so good for our demo, so let’s say that
`createdAt` is set to the current time when the app is booted.

```javascript
App.ApplicationController = Ember.Controller.extend({
  createdAt: new Date()
});
```

We’re back to our 'Created a few seconds ago' output, but we know
everything’s bound together properly now. It’s time to make this clock
tick.

Our `FromNowView` probably needs some sort of `tick` method to trigger
the re-render. Digging into Ember’s API docs reveals some very helpful
methods in the `Ember.run` namespace. We’ll also need to start this
clock ticking, so let’s use the `didInsertElement` hook.

```javascript
App.FromNowView = Ember.View.extend({
  // ...

  didInsertElement: function() {
    this.tick();
  },

  tick: function() {
    Ember.run.later(this, function() {
      console.log('tick');
      // Re-render the view somehow
      this.tick();
    }, 1000);
  }
});
```

If we open the javascript console now, we should see 'tick' written to
the log every second. That’s a start, now we need to figure out how to
re-render the view. Digging again into Ember’s API docs, we find a method
called `notifyPropertyChange` on `Ember.View`. That sounds like it might
work. Let’s give it a go.

```javascript
App.FromNowView = Ember.View.extend({
  // ...

  tick: function() {
    Ember.run.later(this, function() {
      console.log('tick');
      this.notifyPropertyChange('value');
      this.tick();
    }, 1000);
  }
});
```

Leave the page for 60 seconds and we should see 'Created a few seconds ago'
automatically update to 'Created a minute ago' and so on.

This is a good start, but there’s a little problem — there’s nothing
to clean up our `tick` method. If we switch states away from this template
`tick` might get called when the view is no longer on display and we’ll
get errors, not to mention memory leaks.

Digging into Ember’s docs again, we find views have a `willDestroyElement`
hook and Ember provides `Ember.run.cancel` to cancel deferred execution.
So we’ll need to keep a handle on our deferred tick execution and be sure
to cancel it when the view is destroyed.

```javascript
App.FromNowView = Ember.View.extend({
  // ...

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
```

To check this has all worked, let’s rearrange the app a bit. We’ll
create a `clock` route that contains our `fromNow` helper, and jump
back to the index route to check `tick` is not still getting invoked.
We’ll also need to move the value of `createdAt` to a new
`ClockController`.

```javascript
App.Router.map(function() {
  this.route('clock');
});

// ...

App.ClockController = Ember.Controller.extend({
  createdAt: new Date()
});
```

```html
<script type="text/x-handlebars">
  <h1>Ember Time</h1>

  <nav>
    {{#linkTo index}}Home{{/linkTo}}
    {{#linkTo clock}}Clock{{/linkTo}}
  </nav>

  {{outlet}}
</script>

<script type="text/x-handlebars" data-template-name="clock">
  <p>Created {{fromNow valueBinding="createdAt"}}</p>
</script>
```

If everything’s worked, now when we navigate to 'Clock' we should see
'Created a few seconds ago' and if we leave the app in this state long
enough we’ll see 'Created a minute ago'. We should also see the console
logging 'tick' every second and—all being well—when we navigate back
to 'Home' we’ll see the console stops logging 'tick'.
