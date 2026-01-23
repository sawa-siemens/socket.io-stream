// Global setup - starts the Socket.IO server before all tests
let server;

export async function setup() {
  // Dynamically import server to start it
  const serverModule = await import('./server.mjs');
  server = serverModule.server;
  // Give it a moment to initialize
  await new Promise(resolve => setTimeout(resolve, 500));
}

export async function teardown() {
  // Close the server to allow the process to exit
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
}
