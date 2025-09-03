// For development purposes only.
// We can't use the snapshots in the CI environment since they
// will differ ever so slightly from the development env
// and fail our tests. So we use the snapshots only as
// regression detectors when developing.
export default function takeSnapshot(data: string) {
  if (process.env.SNAPSHOTS === 'true') {
    expect(data).toMatchSnapshot();
  }
}
