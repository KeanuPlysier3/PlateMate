// Prints the dev-client's manual-entry URL before `expo start` boots.
// A dev client (unlike Expo Go) doesn't print a scannable QR/URL on its
// own — its "Searching for development servers" screen relies on
// auto-discovery, which fails on networks with client isolation (see
// DevDiary). This is the fallback: the same host:port to type into that
// screen's "Enter URL manually" field.
const os = require("os");

const METRO_PORT = 8081;

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return null;
}

const ip = getLocalIPv4();
if (ip) {
  console.log(`\nDev client manual URL: http://${ip}:${METRO_PORT}\n`);
} else {
  console.log("\nCouldn't detect a local IPv4 address for the manual dev-client URL.\n");
}
