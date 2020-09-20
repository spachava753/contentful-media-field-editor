import * as React from 'react';
import {render} from 'react-dom';
import {AppExtensionSDK, FieldExtensionSDK, init, locations} from 'contentful-ui-extensions-sdk';
import './index.css';
import {App} from "./App";
import {Config} from "./ConfigScreen";


init(sdk => {
  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    render(<App sdk={sdk as FieldExtensionSDK}/>, document.getElementById('root'));
  } else if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<Config sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
  }
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
