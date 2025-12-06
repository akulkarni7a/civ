'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { TribeColor } from '@/lib/types';

const POLL_INTERVAL = 10000; // 10 seconds

interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged_at: string | null;
  html_url: string;
  head: {
    ref: string;
  };
}

interface GitHubCheckRun {
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
}

// Extract tribe from branch name (e.g., "feat/red-move" -> "RED")
function extractTribeFromBranch(branch: string): TribeColor | null {
  const match = branch.toLowerCase().match(/\/(red|blue|green|yellow)/);
  if (match) {
    return match[1].toUpperCase() as TribeColor;
  }
  return null;
}

export function usePRStatus(owner: string, repo: string) {
  const { setCurrentPR, addGlitchingTribe, removeGlitchingTribe } = useGameStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPRStatus = useCallback(async () => {
    try {
      // Fetch open PRs
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=5`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to fetch PR status:', response.status);
        return;
      }

      const prs: GitHubPR[] = await response.json();

      // Find the most relevant PR (tribe strategy changes)
      const relevantPR = prs.find((pr) =>
        pr.head.ref.includes('red') ||
        pr.head.ref.includes('blue') ||
        pr.head.ref.includes('green') ||
        pr.head.ref.includes('yellow')
      );

      if (!relevantPR) {
        setCurrentPR(null);
        return;
      }

      const tribe = extractTribeFromBranch(relevantPR.head.ref);
      if (!tribe) {
        setCurrentPR(null);
        return;
      }

      // Fetch check runs for this PR
      let buildStatus: 'pending' | 'success' | 'failure' | null = null;

      try {
        const checksResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${relevantPR.head.ref}/check-runs`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (checksResponse.ok) {
          const checksData = await checksResponse.json();
          const checkRuns: GitHubCheckRun[] = checksData.check_runs || [];

          if (checkRuns.length > 0) {
            const latestCheck = checkRuns[0];
            if (latestCheck.status === 'completed') {
              buildStatus = latestCheck.conclusion === 'success' ? 'success' : 'failure';
            } else {
              buildStatus = 'pending';
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch check runs:', error);
      }

      // Update store
      setCurrentPR({
        number: relevantPR.number,
        title: relevantPR.title,
        state: relevantPR.merged_at ? 'merged' : relevantPR.state,
        tribe,
        url: relevantPR.html_url,
        buildStatus,
      });

      // Handle glitch state
      if (buildStatus === 'failure') {
        addGlitchingTribe(tribe);
      } else {
        removeGlitchingTribe(tribe);
      }
    } catch (error) {
      console.error('Error fetching PR status:', error);
    }
  }, [owner, repo, setCurrentPR, addGlitchingTribe, removeGlitchingTribe]);

  useEffect(() => {
    // Initial fetch
    fetchPRStatus();

    // Set up polling
    intervalRef.current = setInterval(fetchPRStatus, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPRStatus]);

  return { refetch: fetchPRStatus };
}
