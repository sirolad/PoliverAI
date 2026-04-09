import { NativeModules, Platform } from 'react-native';

type DocumentPickOptions = {
  allowedExtensions?: string[];
  types?: string[];
};

export type PickedDocumentResult = {
  file?: File | null;
  uri?: string;
  name: string;
  type: string;
  size?: number | null;
};

type MacDocumentPickerModule = {
  pickDocument: (options?: { allowedExtensions?: string[] }) => Promise<{
    uri: string;
    name?: string | null;
    type?: string | null;
    size?: number | null;
  }>;
};

type NativeDocumentPickerModule = {
  isCancel: (error: unknown) => boolean;
  pickSingle: (options: {
    type: string[];
    copyTo: 'cachesDirectory';
    presentationStyle: 'fullScreen';
  }) => Promise<{
    uri: string;
    fileCopyUri?: string | null;
    name?: string | null;
    type?: string | null;
    size?: number | null;
  }>;
  types: {
    allFiles: string;
  };
};

function getNativeDocumentPicker(): NativeDocumentPickerModule {
  const moduleName = ['react-native', 'document-picker'].join('-');
  const loadModule = new Function(
    'moduleName',
    'return require(moduleName);'
  ) as (name: string) => unknown;
  const module = loadModule(moduleName) as { default?: NativeDocumentPickerModule };
  return (module.default ?? module) as NativeDocumentPickerModule;
}

function toWebAcceptValue(options: DocumentPickOptions) {
  const extensionAccept = (options.allowedExtensions ?? []).map((extension) =>
    extension.startsWith('.') ? extension : `.${extension}`
  );

  return [...extensionAccept, ...(options.types ?? [])].join(',');
}

function pickDocumentOnWeb(options: DocumentPickOptions): Promise<PickedDocumentResult> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document picker is unavailable in this environment.'));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = toWebAcceptValue(options);
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';

    const cleanup = () => {
      input.remove();
    };

    input.onchange = () => {
      const file = input.files?.[0];
      cleanup();

      if (!file) {
        const error = new Error('User cancelled document picker');
        (error as Error & { code?: string }).code = 'E_PICKER_CANCELLED';
        reject(error);
        return;
      }

      resolve({
        file,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
      });
    };

    document.body.appendChild(input);
    input.click();
  });
}

export function isDocumentPickerCancel(error: unknown) {
  if (Platform.OS !== 'web' && Platform.OS !== 'macos') {
    if (getNativeDocumentPicker().isCancel(error)) {
      return true;
    }
  }

  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'E_PICKER_CANCELLED'
  );
}

export async function pickDocument(options: DocumentPickOptions): Promise<PickedDocumentResult> {
  if (Platform.OS === 'web') {
    return pickDocumentOnWeb(options);
  }

  if (Platform.OS === 'macos') {
    const module = NativeModules.MacDocumentPicker as MacDocumentPickerModule | undefined;

    if (!module?.pickDocument) {
      throw new Error('Mac document picker native module is unavailable.');
    }

    const picked = await module.pickDocument({
      allowedExtensions: options.allowedExtensions ?? [],
    });

    return {
      uri: picked.uri,
      name: picked.name ?? 'document',
      type: picked.type ?? 'application/octet-stream',
      size: picked.size ?? null,
    };
  }

  const documentPicker = getNativeDocumentPicker();
  const picked = await documentPicker.pickSingle({
    type: options.types && options.types.length > 0 ? options.types : [documentPicker.types.allFiles],
    copyTo: 'cachesDirectory',
    presentationStyle: 'fullScreen',
  });

  return {
    uri: picked.fileCopyUri ?? picked.uri,
    name: picked.name ?? 'document',
    type: picked.type ?? 'application/octet-stream',
    size: picked.size ?? null,
  };
}
