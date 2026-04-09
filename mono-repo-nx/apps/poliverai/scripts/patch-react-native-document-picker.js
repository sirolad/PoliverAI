#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(
  __dirname,
  '../../../node_modules/react-native-document-picker/android/src/main/java/com/reactnativedocumentpicker/RNDocumentPickerModule.java'
);

if (!fs.existsSync(target)) {
  console.log('[patch-react-native-document-picker] Target not found, skipping.');
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');

if (source.includes('extends AsyncTask<Void, Void, ReadableArray>')) {
  console.log('[patch-react-native-document-picker] Already patched.');
  process.exit(0);
}

source = source.replace(
  "import android.net.Uri;\n",
  "import android.net.Uri;\nimport android.os.AsyncTask;\n"
);

source = source.replace(
  "import com.facebook.react.bridge.GuardedResultAsyncTask;\n",
  ""
);

source = source.replace(
  "  private static class ProcessDataTask extends GuardedResultAsyncTask<ReadableArray> {\n",
  "  private static class ProcessDataTask extends AsyncTask<Void, Void, ReadableArray> {\n"
);

source = source.replace(
  "      super(reactContext.getExceptionHandler());\n",
  ""
);

source = source.replace(
  "    protected ReadableArray doInBackgroundGuarded() {\n",
  "    protected ReadableArray doInBackground(Void... ignored) {\n"
);

source = source.replace(
  "    protected void onPostExecuteGuarded(ReadableArray readableArray) {\n",
  "    protected void onPostExecute(ReadableArray readableArray) {\n"
);

fs.writeFileSync(target, source);
console.log('[patch-react-native-document-picker] Patch applied.');
