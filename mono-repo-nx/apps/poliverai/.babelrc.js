module.exports = function (api) {
  api.cache(true);

  const isTest = api.env('test');
  const isBuild = process.env.NX_TASK_TARGET_TARGET === 'build' ||
    process.env.NX_TASK_TARGET_TARGET?.includes('storybook');

  if (isBuild) {
    return {
      presets: [
        [
          '@nx/react/babel',
          {
            runtime: 'automatic',
          },
        ],
      ],
    };
  }

  if (isTest) {
    return {
      presets: [
        ['module:@react-native/babel-preset', { 
          useTransformReactJSX: true,
        }],
        '@babel/preset-typescript'
      ],
      plugins: [],
    };
  }

  return {
    presets: [
      ['module:@react-native/babel-preset', { useTransformReactJSX: true }],
    ],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
