declare module '@assets' {
  // Default export is the central assets object (apps/poliverai/assets/index.ts)
  const assets: any;
  export default assets;
}

declare module '@assets/*' {
  const value: any;
  export default value;
}
