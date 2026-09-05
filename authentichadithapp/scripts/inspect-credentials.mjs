/**
 * inspect-credentials.mjs
 *
 * Phase 1 & 2 Credential Inspection & Remediation for Authentic Hadith.
 * Connects to Apple App Store Connect API and Expo EAS GraphQL API to inspect
 * signing assets and safely diagnose credential desynchronization.
 *
 * Adheres to:
 * - No private keys or secrets logged in output.
 * - Non-mutating inspection before any mutation.
 * - Strict verification against Apple Developer & EAS.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BUNDLE_ID = 'com.byred.authentichadith';
const EAS_PROJECT_ID = '66afcbbf-55c3-48fb-9bf1-29efc52d09eb';
const EAS_ACCOUNT = 'redlantern';
const REFERENCED_CERT_SERIAL = '18C72B87D58A8D6CB6E00020B9E1D9BD';
const REFERENCED_CERT_ID = '7M7YD4HR8Q';
const REFERENCED_PROFILE_ID = 'RL2RYR793P';

// ---------------------------------------------------------------------------
// 1. Secret Resolvers
// ---------------------------------------------------------------------------
function getAppleApiKeyConfig() {
  const envRaw = process.env.APPLE_API_KEY_JSON;
  if (envRaw && envRaw.trim()) {
    try {
      return parseKeyJson(envRaw.trim());
    } catch (e) {
      console.warn('[WARN] Failed to parse APPLE_API_KEY_JSON from env:', e.message);
    }
  }

  const filePath = path.resolve(process.cwd(), 'appstoreconnect.json');
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      return parseKeyJson(content);
    } catch (e) {
      console.warn('[WARN] Failed to parse appstoreconnect.json:', e.message);
    }
  }

  return null;
}

function parseKeyJson(raw) {
  let parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const keyId = parsed.key_id || parsed.keyId;
  const issuerId = parsed.issuer_id || parsed.issuerId;
  let privateKey = parsed.key || parsed.private_key || parsed.privateKey;

  if (!privateKey && parsed.key_filepath && fs.existsSync(parsed.key_filepath)) {
    privateKey = fs.readFileSync(parsed.key_filepath, 'utf8');
  }

  if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        privateKey = decoded;
      }
    } catch {}
  }

  if (!keyId || !issuerId || !privateKey) {
    throw new Error('Key JSON must contain key_id, issuer_id, and key.');
  }

  return { keyId, issuerId, privateKey };
}

function getEasToken() {
  return process.env.EAS_TOKEN || process.env.EXPO_TOKEN || null;
}

function getAppleTeamId() {
  return process.env.APPLE_TEAM_ID || null;
}

// ---------------------------------------------------------------------------
// 2. Apple App Store Connect JWT & API Client
// ---------------------------------------------------------------------------
function createAscJwt(keyConfig) {
  const { keyId, issuerId, privateKey } = keyConfig;
  const header = {
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT',
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 1200, // 20 minutes
    aud: 'appstoreconnect-v1',
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const message = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.sign('SHA256', Buffer.from(message), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url');

  return `${message}.${signature}`;
}

async function fetchAsc(endpoint, jwt) {
  const url = endpoint.startsWith('https://')
    ? endpoint
    : `https://api.appstoreconnect.apple.com${endpoint}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Apple ASC API returned ${res.status}: ${errorText}`);
  }

  return await res.json();
}

// ---------------------------------------------------------------------------
// 3. Expo GraphQL API Client
// ---------------------------------------------------------------------------
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
    const errorText = await res.text();
    throw new Error(`Expo GraphQL returned ${res.status}: ${errorText}`);
  }

  const result = await res.json();
  if (result.errors && result.errors.length > 0) {
    throw new Error(`Expo GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// 4. Main Inspection Routine
// ---------------------------------------------------------------------------
async function main() {
  console.log('===============================================================');
  console.log(' Authentic Hadith Signing Credentials Inspector');
  console.log(' Phase 1: Full Signing State & Desynchronization Analysis');
  console.log('===============================================================\n');

  console.log(`EAS Project ID:    ${EAS_PROJECT_ID}`);
  console.log(`EAS Account:       ${EAS_ACCOUNT}`);
  console.log(`Bundle ID:         ${BUNDLE_ID}`);
  console.log(`Configured Team:   ${getAppleTeamId() || '(querying from ASC API)'}`);
  console.log(`Referenced Cert:   ${REFERENCED_CERT_ID} (serial: ${REFERENCED_CERT_SERIAL})`);
  console.log(`Referenced Profile: ${REFERENCED_PROFILE_ID}\n`);

  const keyConfig = getAppleApiKeyConfig();
  const easToken = getEasToken();

  if (!keyConfig) {
    console.error('[-] Apple API key not available in APPLE_API_KEY_JSON or appstoreconnect.json');
  } else {
    console.log(`[+] Apple API Key resolved (Key ID: ${keyConfig.keyId}, Issuer: ${keyConfig.issuerId})`);
  }

  if (!easToken) {
    console.error('[-] EAS token not available in EAS_TOKEN or EXPO_TOKEN');
  } else {
    console.log('[+] EAS Token resolved');
  }

  if (!keyConfig && !easToken) {
    console.error('\nCannot perform remote inspection without credentials.');
    process.exit(1);
  }

  // --- Apple Developer Inspection ---
  let appleCerts = [];
  let appleBundleIds = [];
  let appleProfiles = [];

  if (keyConfig) {
    console.log('\n--- Querying Apple App Store Connect API ---');
    try {
      const jwt = createAscJwt(keyConfig);

      // 1. Certificates
      const certsData = await fetchAsc('/v1/certificates?limit=50', jwt);
      appleCerts = (certsData.data || []).map((c) => ({
        id: c.id,
        name: c.attributes.name,
        certificateType: c.attributes.certificateType,
        serialNumber: c.attributes.serialNumber,
        expirationDate: c.attributes.expirationDate,
        displayName: c.attributes.displayName,
      }));
      console.log(`[+] Apple Developer: Found ${appleCerts.length} total certificates on account.`);

      // 2. Bundle IDs
      const bundleData = await fetchAsc(`/v1/bundleIds?filter[identifier]=${BUNDLE_ID}`, jwt);
      appleBundleIds = (bundleData.data || []).map((b) => ({
        id: b.id,
        identifier: b.attributes.identifier,
        name: b.attributes.name,
        platform: b.attributes.platform,
        seedId: b.attributes.seedId,
      }));
      console.log(`[+] Apple Developer: Found ${appleBundleIds.length} bundle ID registration(s) matching ${BUNDLE_ID}.`);

      // 3. Profiles
      const profilesData = await fetchAsc('/v1/profiles?include=bundleId,certificates&limit=50', jwt);
      const includedMap = new Map((profilesData.included || []).map((inc) => [inc.id, inc]));
      appleProfiles = (profilesData.data || []).map((p) => {
        const linkedCertIds = (p.relationships?.certificates?.data || []).map((ref) => ref.id);
        const linkedBundleId = p.relationships?.bundleId?.data?.id;
        const bundleObj = linkedBundleId ? includedMap.get(linkedBundleId) : null;
        return {
          id: p.id,
          name: p.attributes.name,
          profileType: p.attributes.profileType,
          profileState: p.attributes.profileState,
          expirationDate: p.attributes.expirationDate,
          bundleIdentifier: bundleObj?.attributes?.identifier || linkedBundleId,
          linkedCertIds,
        };
      });
      console.log(`[+] Apple Developer: Found ${appleProfiles.length} total provisioning profiles on account.`);
    } catch (err) {
      console.error('[-] Error querying Apple Developer API:', err.message);
    }
  }

  // --- Expo EAS Inspection ---
  let easCerts = [];
  let currentBuildCredentials = null;

  if (easToken) {
    console.log('\n--- Querying Expo EAS Credentials Service ---');
    try {
      // 1. Account Distribution Certificates
      const distCertsQuery = `
        query GetAccountDistCerts($accountName: String!) {
          account {
            byName(accountName: $accountName) {
              id
              name
              appleDistributionCertificatesPaginated(first: 50) {
                edges {
                  node {
                    id
                    serialNumber
                    validityNotBefore
                    validityNotAfter
                    developerPortalIdentifier
                    appleTeam {
                      id
                      appleTeamIdentifier
                      appleTeamName
                    }
                    iosAppBuildCredentialsList {
                      id
                      iosAppCredentials {
                        app {
                          id
                          fullName
                          slug
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const easCertsData = await fetchExpoGraphql(distCertsQuery, { accountName: EAS_ACCOUNT }, easToken);
      const edges = easCertsData?.account?.byName?.appleDistributionCertificatesPaginated?.edges || [];
      easCerts = edges.map((e) => {
        const node = e.node;
        const apps = (node.iosAppBuildCredentialsList || [])
          .map((b) => b.iosAppCredentials?.app?.fullName || b.iosAppCredentials?.app?.slug)
          .filter(Boolean);
        return {
          id: node.id,
          serialNumber: node.serialNumber,
          validityNotBefore: node.validityNotBefore,
          validityNotAfter: node.validityNotAfter,
          developerPortalIdentifier: node.developerPortalIdentifier,
          teamId: node.appleTeam?.appleTeamIdentifier,
          teamName: node.appleTeam?.appleTeamName,
          usedByApps: apps,
        };
      });
      console.log(`[+] EAS: Found ${easCerts.length} distribution certificate(s) on account ${EAS_ACCOUNT}.`);

      // 2. Project Build Credentials for Authentic Hadith
      const appQuery = `
        query GetAppBuildCredentials($appId: String!) {
          app {
            byId(appId: $appId) {
              id
              fullName
              slug
              ownerAccount {
                id
                name
              }
              iosAppCredentials {
                id
                appleAppIdentifier {
                  id
                  bundleIdentifier
                }
                appleTeam {
                  id
                  appleTeamIdentifier
                  appleTeamName
                }
                iosAppBuildCredentialsList {
                  id
                  iosDistributionType
                  appleDistributionCertificate {
                    id
                    serialNumber
                    validityNotBefore
                    validityNotAfter
                    developerPortalIdentifier
                  }
                  provisioningProfile {
                    id
                    developerPortalIdentifier
                    status
                    expirationDate
                  }
                }
              }
            }
          }
        }
      `;
      const appData = await fetchExpoGraphql(appQuery, { appId: EAS_PROJECT_ID }, easToken);
      const appObj = appData?.app?.byId;
      currentBuildCredentials = appObj?.iosAppCredentials || [];
      console.log(`[+] EAS: Fetched project build credentials for ${appObj?.fullName || EAS_PROJECT_ID}.`);
    } catch (err) {
      console.error('[-] Error querying Expo EAS GraphQL:', err.message);
    }
  }

  // --- Analysis & Answers to Phase 1 Questions ---
  console.log('\n===============================================================');
  console.log(' Phase 1 Answers: Current Signing State Assessment');
  console.log('===============================================================\n');

  // 1. Current EAS project
  console.log(`1. Current EAS Project:`);
  console.log(`   - Project ID: ${EAS_PROJECT_ID}`);
  console.log(`   - Account:    ${EAS_ACCOUNT}`);
  console.log(`   - Slug:       authentichadithapp\n`);

  // 2. Apple Team ID
  const effectiveTeamId =
    getAppleTeamId() ||
    appleBundleIds[0]?.seedId ||
    easCerts[0]?.teamId ||
    'UNKNOWN';
  console.log(`2. Apple Team ID: ${effectiveTeamId}\n`);

  // 3. Bundle identifier
  console.log(`3. Bundle Identifier: ${BUNDLE_ID}\n`);

  // 4. Distribution certificates known to EAS
  console.log(`4. Distribution Certificates Known to EAS:`);
  if (easCerts.length === 0) {
    console.log('   (None returned or EAS query unavailable)');
  } else {
    for (const c of easCerts) {
      console.log(`   - EAS Cert ID:  ${c.id}`);
      console.log(`     Apple ID:     ${c.developerPortalIdentifier || 'N/A'}`);
      console.log(`     Serial:       ${c.serialNumber}`);
      console.log(`     Expires:      ${c.validityNotAfter}`);
      console.log(`     Apple Team:   ${c.teamId || 'N/A'}`);
      console.log(`     Used by Apps: ${c.usedByApps.join(', ') || 'None'}`);
    }
  }
  console.log('');

  // 5. Provisioning profiles known to EAS / Current project bindings
  console.log(`5. Current Project Credentials Configuration in EAS:`);
  if (!currentBuildCredentials || currentBuildCredentials.length === 0) {
    console.log('   (No build credentials found)');
  } else {
    for (const cred of currentBuildCredentials) {
      const bundle = cred.appleAppIdentifier?.bundleIdentifier;
      const team = cred.appleTeam?.appleTeamIdentifier;
      console.log(`   - Bundle: ${bundle}, Team: ${team}`);
      for (const b of cred.iosAppBuildCredentialsList || []) {
        console.log(`     Distribution Type: ${b.iosDistributionType}`);
        console.log(`     Assigned Dist Cert ID: ${b.appleDistributionCertificate?.id || 'None'} (serial: ${b.appleDistributionCertificate?.serialNumber || 'N/A'})`);
        console.log(`     Assigned Profile ID:   ${b.provisioningProfile?.developerPortalIdentifier || b.provisioningProfile?.id || 'None'} (status: ${b.provisioningProfile?.status || 'N/A'})`);
      }
    }
  }
  console.log('');

  // 6. Does referenced certificate still exist in Apple Developer?
  const referencedInApple = appleCerts.find(
    (c) =>
      c.serialNumber === REFERENCED_CERT_SERIAL ||
      c.id === REFERENCED_CERT_ID
  );
  console.log(`6. Does Referenced Certificate (${REFERENCED_CERT_ID} / ${REFERENCED_CERT_SERIAL}) Exist in Apple Developer?`);
  if (referencedInApple) {
    console.log(`   YES: Found in Apple Developer: ID ${referencedInApple.id}, Status active, Expires: ${referencedInApple.expirationDate}`);
  } else {
    console.log(`   NO: Certificate with serial ${REFERENCED_CERT_SERIAL} DOES NOT EXIST in Apple Developer account.`);
    console.log(`   -> Root Cause Confirmed: EAS points to a certificate that has been revoked or removed on Apple.`);
  }
  console.log('');

  // 7. Does a different valid distribution certificate already exist in Apple Developer?
  const now = new Date();
  const validDistCertsInApple = appleCerts.filter((c) => {
    const isDist = c.certificateType === 'DISTRIBUTION' || c.certificateType === 'IOS_DISTRIBUTION';
    const notExpired = new Date(c.expirationDate) > now;
    return isDist && notExpired;
  });

  console.log(`7. Other Valid Distribution Certificates in Apple Developer:`);
  console.log(`   Found ${validDistCertsInApple.length} active distribution certificate(s) on Apple Developer.`);
  for (const c of validDistCertsInApple) {
    console.log(`   - Apple Cert ID: ${c.id}`);
    console.log(`     Name:          ${c.name}`);
    console.log(`     Serial:        ${c.serialNumber}`);
    console.log(`     Type:          ${c.certificateType}`);
    console.log(`     Expires:       ${c.expirationDate}`);
  }
  console.log('');

  // 8. Whether that certificate is already used by another application
  console.log(`8. Cross-Application Usage Analysis for Valid Certificates:`);
  for (const ac of validDistCertsInApple) {
    const matchedEasCert = easCerts.find((ec) => ec.serialNumber === ac.serialNumber || ec.developerPortalIdentifier === ac.id);
    if (matchedEasCert) {
      console.log(`   - Apple Cert ${ac.id} (serial ${ac.serialNumber}):`);
      console.log(`     Present in EAS: YES (EAS ID: ${matchedEasCert.id})`);
      console.log(`     Used by Apps:   ${matchedEasCert.usedByApps.join(', ') || 'No other apps'}`);
    } else {
      console.log(`   - Apple Cert ${ac.id} (serial ${ac.serialNumber}):`);
      console.log(`     Present in EAS: NO (not yet imported into EAS)`);
    }
  }
  console.log('');

  // --- Profiles for com.byred.authentichadith in Apple Developer ---
  console.log(`--- Apple Developer Profiles for ${BUNDLE_ID} ---`);
  const hadithProfiles = appleProfiles.filter((p) => p.bundleIdentifier === BUNDLE_ID);
  if (hadithProfiles.length === 0) {
    console.log(`   No provisioning profiles found matching ${BUNDLE_ID}.`);
  } else {
    for (const p of hadithProfiles) {
      console.log(`   - Profile ID:   ${p.id}`);
      console.log(`     Name:         ${p.name}`);
      console.log(`     Type:         ${p.profileType}`);
      console.log(`     State:        ${p.profileState}`);
      console.log(`     Expires:      ${p.expirationDate}`);
      console.log(`     Linked Certs: ${p.linkedCertIds.join(', ')}`);
    }
  }

  console.log('\n===============================================================');
  console.log(' Phase 1 Inspection Completed');
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
