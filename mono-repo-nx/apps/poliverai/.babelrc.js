module.exports = function (api) {
  const env = api.env();
  api.cache.using(() => `${env}:${process.env.NX_TASK_TARGET_TARGET ?? ''}`);

  const isTest = env === 'test';
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
      'nativewind/babel',
    ],
    plugins: [],
  };
};
