const EAS_GRAPHQL_ENDPOINT = 'https://api.expo.dev/graphql';
const EAS_TOKEN = process.env.EAS_TOKEN || process.env.EXPO_TOKEN;
const BUILD_ID = process.argv[2] || process.env.BUILD_ID || 'f4b6bf9e-9251-4891-91fe-4c4caf2bd40a';
const EAS_PROJECT_ID = '66afcbbf-55c3-48fb-9bf1-29efc52d09eb';

if (!EAS_TOKEN) {
  console.error('[ERROR] EAS_TOKEN environment variable is required.');
  process.exit(1);
}

async function fetchGraphql(query, variables = {}) {
  const res = await fetch(EAS_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${EAS_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL Errors: ${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data;
}

async function main() {
  console.log('===============================================================');
  console.log(`[*] Inspecting EAS Build ID: ${BUILD_ID}`);
  console.log('===============================================================');

  const buildQuery = `
    query GetBuildDetails($buildId: ID!) {
      builds {
        byId(buildId: $buildId) {
          id
          status
          platform
          error {
            errorCode
            message
            docsUrl
          }
          artifacts {
            buildUrl
            xcodeBuildLogsUrl
            applicationArchiveUrl
            buildArtifactsUrl
          }
          logFiles
          app {
            id
            name
            slug
            ownerAccount {
              id
              name
            }
          }
          distribution
          iosEnterpriseProvisioning
          buildProfile
          appIdentifier
          createdAt
          updatedAt
          completedAt
        }
      }
    }
  `;

  const buildData = await fetchGraphql(buildQuery, { buildId: BUILD_ID });
  const build = buildData?.builds?.byId;

  console.log('\n--- BUILD SUMMARY ---');
  console.log(`ID:           ${build?.id}`);
  console.log(`Status:       ${build?.status}`);
  console.log(`Platform:     ${build?.platform}`);
  console.log(`Profile:      ${build?.buildProfile}`);
  console.log(`App Bundle:   ${build?.appIdentifier}`);
  console.log(`Created At:   ${build?.createdAt}`);
  console.log(`Completed At: ${build?.completedAt}`);
  console.log(`Error:        ${JSON.stringify(build?.error, null, 2)}`);
  console.log(`Artifacts:    ${JSON.stringify(build?.artifacts, null, 2)}`);
  console.log(`Log URL count:${build?.logFiles?.length || 0}`);

  // Fetch full log files
  const logFiles = build?.logFiles || [];
  for (let i = 0; i < logFiles.length; i++) {
    const url = logFiles[i];
    console.log(`\n===============================================================`);
    console.log(`=== REMOTE LOG FILE [${i + 1}/${logFiles.length}] ===`);
    console.log(`=== URL: ${url}`);
    console.log(`===============================================================\n`);

    const logRes = await fetch(url);
    if (!logRes.ok) {
      console.error(`Failed to fetch log file: HTTP ${logRes.status}`);
      continue;
    }
    const logContent = await logRes.text();
    console.log(logContent);
  }

  // Inspect current EAS credentials configuration
  console.log('\n===============================================================');
  console.log('[*] Inspecting Current EAS Credentials for App');
  console.log('===============================================================');

  const appCredsQuery = `
    query AppCredentials($appId: String!) {
      app {
        byId(appId: $appId) {
          id
          name
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
              distributionCertificate {
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
                expiration
              }
            }
          }
        }
      }
    }
  `;

  try {
    const appData = await fetchGraphql(appCredsQuery, { appId: EAS_PROJECT_ID });
    console.log(JSON.stringify(appData, null, 2));
  } catch (err) {
    console.error('[WARN] Could not query app credentials:', err.message);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
