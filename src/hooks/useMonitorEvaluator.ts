import { useCallback, useRef } from 'react';
import useStore from '@/stores/store';
import type { Monitor, MonitorResult, MonitorObservation, MonitorStatistics } from '@/types';

/** Compute statistics from an array of observations */
function computeStatistics(observations: MonitorObservation[]): MonitorStatistics {
  if (observations.length === 0) {
    return { count: 0, sum: 0, avg: 0, min: 0, max: 0, stdDev: 0 };
  }
  const values = observations.map((o) => o.value);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / count;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);
  return { count, sum, avg, min, max, stdDev };
}

/**
 * Hook that manages monitor evaluation during simulation.
 * Returns a callback to evaluate all enabled monitors after each simulation step,
 * a ref to the accumulated results, and a reset function.
 */
export function useMonitorEvaluator() {
  const resultsRef = useRef<Map<string, MonitorResult>>(new Map());

  /** Reset all accumulated monitor results */
  const resetResults = useCallback(() => {
    resultsRef.current = new Map();
  }, []);

  /** Get current results as an array */
  const getResults = useCallback((): MonitorResult[] => {
    return Array.from(resultsRef.current.values());
  }, []);

  /**
   * Evaluate all enabled monitors after a simulation step.
   * Call this from handleWasmEvent after markings have been updated.
   *
   * @param step - current step number
   * @param time - simulation time
   * @param firedTransitionId - the transition that just fired
   * @param consumedPlaceIds - place IDs from which tokens were consumed
   * @param producedPlaceIds - place IDs to which tokens were produced
   */
  const evaluateMonitors = useCallback(
    (
      step: number,
      time: number,
      firedTransitionId: string,
      consumedPlaceIds: string[],
      producedPlaceIds: string[],
    ) => {
      const state = useStore.getState();
      const monitors: Monitor[] = state.monitors.filter((m) => m.enabled);
      if (monitors.length === 0) return;

      // Collect all place markings from all nets
      const placeMarkings = new Map<string, number>();
      for (const net of Object.values(state.petriNetsById)) {
        for (const node of net.nodes) {
          if (node.type === 'place') {
            const marking = node.data?.marking;
            const count = Array.isArray(marking) ? marking.length : 0;
            placeMarkings.set(node.id, count);
          }
        }
      }

      const affectedPlaceIds = new Set([...consumedPlaceIds, ...producedPlaceIds]);

      for (const monitor of monitors) {
        let value: number | null = null;
        let shouldRecord = false;

        switch (monitor.type) {
          case 'marking-size': {
            // Sum marking sizes of all watched places
            if (monitor.placeIds.length === 0) break;
            // Only record if any of the watched places were affected
            const watchedAffected = monitor.placeIds.some((pid) => affectedPlaceIds.has(pid));
            if (!watchedAffected && step > 1) break; // Always record step 1
            value = monitor.placeIds.reduce((sum, pid) => sum + (placeMarkings.get(pid) ?? 0), 0);
            shouldRecord = true;
            break;
          }

          case 'transition-count': {
            // Count if the fired transition is one of the watched transitions
            if (monitor.transitionIds.includes(firedTransitionId)) {
              // Get current count from existing observations
              const existing = resultsRef.current.get(monitor.id);
              value = (existing?.observations.length ?? 0) + 1;
              shouldRecord = true;
            }
            break;
          }

          case 'breakpoint-place': {
            // Check if any watched place meets the stop condition
            if (monitor.placeIds.length === 0) break;
            const condition = monitor.config.stopCondition ?? 'empty';
            for (const pid of monitor.placeIds) {
              const count = placeMarkings.get(pid) ?? 0;
              if (
                (condition === 'empty' && count === 0) ||
                (condition === 'not-empty' && count > 0)
              ) {
                value = count;
                shouldRecord = true;
                break;
              }
            }
            break;
          }

          case 'breakpoint-transition': {
            // Check if the fired transition matches any watched transition
            const condition = monitor.config.stopCondition ?? 'enabled';
            if (condition === 'enabled' && monitor.transitionIds.includes(firedTransitionId)) {
              value = 1;
              shouldRecord = true;
            }
            break;
          }
        }

        if (shouldRecord && value !== null) {
          const observation: MonitorObservation = { step, time, value };

          if (!resultsRef.current.has(monitor.id)) {
            resultsRef.current.set(monitor.id, {
              monitorId: monitor.id,
              observations: [],
              statistics: { count: 0, sum: 0, avg: 0, min: 0, max: 0, stdDev: 0 },
            });
          }

          const result = resultsRef.current.get(monitor.id)!;
          result.observations.push(observation);
          result.statistics = computeStatistics(result.observations);
        }
      }
    },
    [],
  );

  return { evaluateMonitors, getResults, resetResults };
}
