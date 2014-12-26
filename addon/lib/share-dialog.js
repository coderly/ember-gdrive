import Ember from 'ember';
import config from 'ember-gdrive/lib/config';

export default Ember.Object.extend({
  documentId: Ember.required(),
  show: function() {
    var shareClient = new gapi.drive.share.ShareClient(config.get('GOOGLE_DRIVE_SDK_APP_ID'));

    shareClient.setItemIds([ this.get('documentId') ]);
    shareClient.showSettingsDialog();
  }
});
