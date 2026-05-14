import type { AppDispatch } from '@/store';
import { setProgression } from '@/store/progression/progressionSlice';
import { setStreaks } from '@/store/streaks/streaksSlice';
import { setAchievements } from '@/store/achievements/achievementsSlice';
import { setQuests } from '@/store/quests/questsSlice';
import { setRewards } from '@/store/rewards/rewardsSlice';
import { setTournamentPass } from '@/store/tournamentPass/tournamentPassSlice';
import type { ArenaSummary } from '@/services/arenaApi';

export function hydrateArenaFromSummary(dispatch: AppDispatch, data: ArenaSummary) {
  const eng = data.engagement as {
    seasonXp?: number;
    fanRank?: string;
    prestigeTier?: number;
    loginStreak?: number;
    predictionStreak?: number;
    participationStreak?: number;
    streakFreezesRemaining?: number;
    coins?: number;
    inventoryItemIds?: string[];
    equippedTitle?: string;
    equippedFrame?: string;
  };
  dispatch(
    setProgression({
      ...data.progression,
      seasonXp: Number(eng.seasonXp ?? 0),
      fanRank: String(eng.fanRank ?? 'Rookie'),
      prestigeTier: Number(eng.prestigeTier ?? 0),
    })
  );
  dispatch(
    setStreaks({
      login: Number(eng.loginStreak ?? 0),
      prediction: Number(eng.predictionStreak ?? 0),
      participation: Number(eng.participationStreak ?? 0),
      freezesRemaining: Number(eng.streakFreezesRemaining ?? 0),
    })
  );
  dispatch(setAchievements((data.achievements ?? []) as never));
  dispatch(setQuests((data.missions ?? []) as never));
  dispatch(
    setRewards({
      coins: Number(eng.coins ?? 0),
      inventoryIds: (eng.inventoryItemIds as string[] | undefined) ?? [],
      equippedTitle: eng.equippedTitle,
      equippedFrame: eng.equippedFrame,
    })
  );
  dispatch(setTournamentPass(data.pass));
}
