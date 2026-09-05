const EAS_GRAPHQL_ENDPOINT = 'https://api.expo.dev/graphql';
const EAS_TOKEN = process.env.EAS_TOKEN || process.env.EXPO_TOKEN;
const BUILD_ID = process.argv[2] || process.env.BUILD_ID || 'f4b6bf9e-9251-4891-91fe-4c4caf2bd40a';

if (!EAS_TOKEN) {
  console.error('[ERROR] EAS_TOKEN environment variable is required.');
  process.exit(1);
}

async function main() {
  console.log(`[*] Querying EAS Build: ${BUILD_ID}`);
  const query = `
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
        }
      }
    }
  `;

  const res = await fetch(EAS_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${EAS_TOKEN}`,
    },
    body: JSON.stringify({ query, variables: { buildId: BUILD_ID } }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ERROR] HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    console.error('[ERROR] GraphQL Errors:', JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }

  const build = json.data?.builds?.byId;
  console.log('\n=== BUILD METADATA ===');
  console.log(`ID:           ${build.id}`);
  console.log(`Status:       ${build.status}`);
  console.log(`App ID:       ${build.appIdentifier}`);
  console.log(`Profile:      ${build.buildProfile}`);
  console.log(`Error:        ${JSON.stringify(build.error, null, 2)}`);
  console.log(`Log Files:    ${JSON.stringify(build.logFiles, null, 2)}`);

  const logFiles = build.logFiles || [];
  for (let i = 0; i < logFiles.length; i++) {
    const url = logFiles[i];
    console.log(`\n===============================================================`);
    console.log(`=== LOG FILE [${i + 1}/${logFiles.length}]: ${url}`);
    console.log(`===============================================================\n`);
    const logRes = await fetch(url);
    if (!logRes.ok) {
      console.error(`Failed to fetch log file: HTTP ${logRes.status}`);
      continue;
    }
    const logContent = await logRes.text();
    console.log(logContent);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
