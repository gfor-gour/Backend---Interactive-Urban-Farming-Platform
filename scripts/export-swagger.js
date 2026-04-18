import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'openapi.json');
const PRIMARY_PORT = 3000;
const FALLBACK_PORT = 3001;


if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✓ Created directory: ${OUTPUT_DIR}`);
}

async function fetchSpec(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch spec: HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}


function saveSpec(data) {
  const spec = JSON.parse(data);
  const prettifiedJson = JSON.stringify(spec, null, 2);
  fs.writeFileSync(OUTPUT_FILE, prettifiedJson, 'utf8');
}


function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}


async function main() {
  console.log(`\n📚 Swagger Export Tool`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log(`🔍 Checking if server is running on port ${PRIMARY_PORT}...`);
  try {
    console.log(`📡 Fetching OpenAPI spec from http://localhost:${PRIMARY_PORT}/api/docs-json...`);
    const data = await fetchSpec(`http://localhost:${PRIMARY_PORT}/api/docs-json`);
    saveSpec(data);
    
    console.log(`✅ OpenAPI spec exported successfully!`);
    console.log(`📄 File saved: ${OUTPUT_FILE}`);
    showImportInstructions();
    process.exit(0);
  } catch (error) {
    console.log(`   ℹ️  Server not running on port ${PRIMARY_PORT}`);
  }

  console.log(`\n🚀 Starting temporary server on port ${FALLBACK_PORT}...`);
  
  try {
    const app = (await import('../app.js')).default;
    const server = http.createServer(app);

    server.listen(FALLBACK_PORT, async () => {
      console.log(`✓ Server started on port ${FALLBACK_PORT}`);
      console.log(`📡 Fetching OpenAPI spec...`);

      try {
        const data = await fetchSpec(`http://localhost:${FALLBACK_PORT}/api/docs-json`);
        saveSpec(data);
        
        console.log(`OpenAPI spec exported successfully!`);
        console.log(`File saved: ${OUTPUT_FILE}`);
        showImportInstructions();
        
        server.close(() => {
          console.log(`Server closed.`);
          process.exit(0);
        });
      } catch (error) {
        console.error(`Error fetching spec:`, error.message);
        server.close(() => {
          process.exit(1);
        });
      }
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${FALLBACK_PORT} is also in use!`);
        console.log(`   Windows: taskkill /F /IM node.exe`);
        console.log(`   Mac/Linux: killall node`);
      } else {
        console.error(`Server error:`, err.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`Error starting server:`, error.message);
    process.exit(1);
  }
}


function showImportInstructions() {
  console.log(`\nImport instructions:`);
  console.log(`   • Postman: File → Import → Select ${OUTPUT_FILE}`);
  console.log(`   • Swagger Editor: https://editor.swagger.io/ → File → Import File`);
  console.log(`   • IntelliJ/WebStorm: Right-click → Generate → REST Client or cURL`);

}

process.on('SIGINT', () => {
  console.log('\nInterrupted. Exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nTerminated. Exiting...');
  process.exit(0);
});


main().catch((error) => {
  console.error(`Unexpected error:`, error.message);
  process.exit(1);
});
