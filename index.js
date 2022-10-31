import core from '@actions/core';
import github from '@actions/github';

function findByHeadSha(pullRequests, sha) {
  return pullRequests.find((pullRequest) =>
    pullRequest.head.sha.startsWith(sha)
  );
}

function getLastPullRequest(pullRequests, options) {
  options = { ...Defaults, ...options };

  const filteredPRs = pullRequests
    .filter(({ state }) => state === 'open' || !!options.closed)
    .filter(({ draft }) => !draft || !!options.draft);

  if (filteredPRs.length === 0) return null;

  const defaultChoice = pullRequests[0];
  const preferredChoice =
    options.preferWithHeadSha !== undefined
      ? findByHeadSha(pullRequests, options.preferWithHeadSha)
      : null;
  return preferredChoice || defaultChoice;
}

async function getPullRequestsAssociatedWithCommits(octokit, sha) {
  const result = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commit_sha: sha,
  });
  core.debug(`Used url to fetch associated PRs: ${result.url}`);
  return result.data;
}

async function main() {
  try {
    const { token, sha, filterOutClosed, filterOutDraft } = getInputs();

    const octokit = github.getOctokit(token);
    const allPRs = await getPRsAssociatedWithCommit(octokit, sha);

    const pr = getLastPullRequest(allPRs, {
      draft: !filterOutDraft,
      closed: !filterOutClosed,
      preferWithHeadSha: sha,
    });

    console.log(pr);

    core.exportVariable('TEST_VAR', '1234');
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

main();
