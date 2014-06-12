export default Ember.Object.extend({
  documentId: Ember.required(),
  show: function() {
    var shareClient = new gapi.drive.share.ShareClient(ENV.GOOGLE_DRIVE_SDK_APP_ID);

    shareClient.setItemIds([ this.get('documentId') ]);
    shareClient.showSettingsDialog();
  }
});
