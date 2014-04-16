export default Ember.Object.extend({
  appID: ENV.GOOGLE_DRIVE_SDK_APP_ID,
  fileID: Ember.required(),
  show: function() {
    var appID = this.get('appID'),
        fileID = this.get('fileID'),
        shareClient = new gapi.drive.share.ShareClient(appID);

    shareClient.setItemIds([fileID]);
    shareClient.showSettingsDialog();
  }
});
