// `.open-next/worker.js` only exists after `npm run cf:build` — this ambient
// declaration lets custom-worker.ts import it without needing a suppression
// comment (whose correctness would depend on whether a build has run).
declare module "./.open-next/worker.js" {
  const handler: ExportedHandler<CloudflareEnv>
  export default handler
}
