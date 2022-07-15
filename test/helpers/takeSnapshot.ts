// For development purposes only.
// We compare the snapshots in CI environment since they
// will differ ever so slighly from the development env
// and fail our tests. So we use the snapshots only as
// regression detectors when developing.
export default function takeSnapshot(data: string) {
  if (process.env.CI !== 'true') {
    expect(data).toMatchSnapshot();
  }
}
