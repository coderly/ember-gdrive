import Ember from 'ember';
import config from 'ember-gdrive/lib/config';

export default Ember.Object.extend(Ember.Evented, {
  token: null,
  apiKey: config.get('GOOGLE_API_KEY'),
  mimeTypes: config.get('GOOGLE_MIME_TYPE'),

  show: function() {
    this.get('googlePicker').setVisible(true);
  },

  googlePicker: function() {
    var callback = this.googlePickerCallback.bind(this),
        token = this.get('token'),
        apiKey = this.get('apiKey'),
        mimeTypes = this.get('mimeTypes');

    var view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes(mimeTypes);

    return new google.picker.PickerBuilder()
      .addView(view)
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setDeveloperKey(apiKey)
      .setSelectableMimeTypes(mimeTypes)
      .setOAuthToken(token)
      .setCallback(callback)
      .build();
  }.property('token'),

  googlePickerCallback: function(result) {
    if (result.action === google.picker.Action.PICKED) {
      this.trigger('selected', result.docs[0]);
    }
  }

});
