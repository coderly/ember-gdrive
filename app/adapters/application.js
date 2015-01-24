import GoogleDriveAdapter from 'ember-gdrive/adapters/google-drive';
import CustomFixtureAdapter from 'ember-gdrive/adapters/custom-fixture';

var Adapter = window.testDocument ? CustomFixtureAdapter.extend() : GoogleDriveAdapter.extend();	

export default Adapter;