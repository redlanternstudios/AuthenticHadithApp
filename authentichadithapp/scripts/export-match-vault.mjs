/**
 * export-match-vault.mjs
 *
 * Extracts the active By red llc Apple Distribution Certificate (9RU99Z24B6)
 * from EAS Cloud credentials service and packages it into the exact
 * Fastlane Match encrypted vault format.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const EAS_ACCOUNT = 'redlantern';
const TARGET_CERT_SERIAL = '1BB9B8E4877E3055339592AEF5EBE5A2';
const TARGET_CERT_ID = '9RU99Z24B6';
const MATCH_PASSWORD = process.env.MATCH_PASSWORD || 'ByRed2026!';

const easToken = process.env.EAS_TOKEN || process.env.EXPO_TOKEN;
if (!easToken) {
  console.error('[-] FATAL: EAS_TOKEN is required.');
  process.exit(1);
}

async function fetchExpoGraphql(query, variables, token) {
  const res = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo GraphQL HTTP ${res.status}: ${text}`);
  }
  const result = await res.json();
  if (result.errors && result.errors.length > 0) {
    throw new Error(`Expo GraphQL Error: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}

function encryptMatchFile(filePath, password) {
  const encOut = filePath + '.enc';
  execSync(`openssl aes-256-cbc -k "${password}" -in "${filePath}" -out "${encOut}" -md md5`);
  const rawEnc = fs.readFileSync(encOut);
  const b64 = rawEnc.toString('base64');
  // Match Base64 encoding includes standard 60-char lines or standard base64
  fs.writeFileSync(filePath, b64 + '\n');
  fs.unlinkSync(encOut);
}

async function main() {
  console.log('[*] Querying EAS Cloud for distribution certificates...');
  const distCertsQuery = `
    query GetAccountDistCerts($accountName: String!) {
      account {
        byName(accountName: $accountName) {
          appleDistributionCertificatesPaginated(first: 50) {
            edges {
              node {
                id
                serialNumber
                developerPortalIdentifier
                certificateP12
                certificatePassword
              }
            }
          }
        }
      }
    }
  `;

  const easData = await fetchExpoGraphql(distCertsQuery, { accountName: EAS_ACCOUNT }, easToken);
  const certEdges = easData?.account?.byName?.appleDistributionCertificatesPaginated?.edges || [];
  console.log(`[+] Found ${certEdges.length} distribution cert(s) in EAS.`);

  const targetNode = certEdges.find((e) => {
    const n = e.node;
    return n.serialNumber === TARGET_CERT_SERIAL || n.developerPortalIdentifier === TARGET_CERT_ID;
  })?.node;

  if (!targetNode || !targetNode.certificateP12) {
    console.error(`[-] FATAL: Could not locate distribution certificate ${TARGET_CERT_ID} with P12 payload.`);
    process.exit(1);
  }

  console.log(`[+] Located target cert: ${targetNode.developerPortalIdentifier || TARGET_CERT_ID} (serial: ${targetNode.serialNumber})`);

  const outDir = path.resolve(process.cwd(), 'match_vault_export');
  const certsDir = path.join(outDir, 'certs', 'distribution');
  fs.mkdirSync(certsDir, { recursive: true });

  const tempIn = path.join(outDir, 'temp_raw.p12');
  const tempPem = path.join(outDir, 'temp.pem');
  const finalCer = path.join(certsDir, `${TARGET_CERT_ID}.cer`);
  const finalP12 = path.join(certsDir, `${TARGET_CERT_ID}.p12`);

  fs.writeFileSync(tempIn, Buffer.from(targetNode.certificateP12, 'base64'));

  console.log('[*] Extracting certificate and private key...');
  try {
    execSync(`openssl pkcs12 -legacy -in "${tempIn}" -passin pass:"${targetNode.certificatePassword || ''}" -nodes -out "${tempPem}"`);
  } catch {
    execSync(`openssl pkcs12 -in "${tempIn}" -passin pass:"${targetNode.certificatePassword || ''}" -nodes -out "${tempPem}"`);
  }

  // Generate raw DER certificate
  execSync(`openssl x509 -in "${tempPem}" -outform DER -out "${finalCer}"`);
  console.log(`[+] Extracted DER certificate: ${finalCer}`);

  // Generate legacy PKCS#12 bundle with MATCH_PASSWORD
  execSync(`openssl pkcs12 -export -legacy -in "${tempPem}" -passout pass:"${MATCH_PASSWORD}" -out "${finalP12}"`);
  console.log(`[+] Generated legacy PKCS#12 bundle: ${finalP12}`);

  // Clean up unencrypted intermediates
  fs.unlinkSync(tempIn);
  fs.unlinkSync(tempPem);

  // Encrypt both for Fastlane Match
  console.log('[*] Encrypting resources using Fastlane Match format...');
  encryptMatchFile(finalCer, MATCH_PASSWORD);
  encryptMatchFile(finalP12, MATCH_PASSWORD);

  // Create match_version.txt
  fs.writeFileSync(path.join(outDir, 'match_version.txt'), '2.239.0\n');

  console.log('[+] Match vault export completed successfully:');
  console.log(`    - ${finalCer}`);
  console.log(`    - ${finalP12}`);
}

main().catch((err) => {
  console.error('[-] Export failed:', err);
  process.exit(1);
});
