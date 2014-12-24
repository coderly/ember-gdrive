import Ember from 'ember';
import Config from '../config/environment';

export default Ember.Object.extend({
  documentId: Ember.required(),
  show: function() {
    var shareClient = new gapi.drive.share.ShareClient(Config['ember-gdrive'].GOOGLE_DRIVE_SDK_APP_ID);

    shareClient.setItemIds([ this.get('documentId') ]);
    shareClient.showSettingsDialog();
  }
});
