import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProfileTemplateB } from "./_ProfileTemplates";
import { buildProfileMock } from "./_profileMockData";
import type { RankingRow } from "./_shared";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import type { RealBadge } from "./_profileSections";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: RankingRow | null;
  position: number;
  name: string;
  userId?: string;
}

export default function ProfileDialog({ open, onOpenChange, row, position, name, userId }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // local equipped state for optimistic updates (null = not yet initialised from realData)
  const [equippedKeys, setEquippedKeys] = useState<Set<string> | null>(null);

  // Detect logged-in user once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const meta = session.user.app_metadata as Record<string, unknown>;
        setIsAdmin(meta?.role === "admin");
      }
    });
  }, []);

  // Reset local equipped state whenever we open a different profile
  useEffect(() => {
    setEquippedKeys(null);
  }, [userId]);

  const isOwner = !!currentUserId && currentUserId === (userId ?? "");

  // When owner or admin: also fetch missions (isOwnProfile = true in hook)
  const { data: realData } = useUserProfile(userId ?? null, isOwner || isAdmin);

  // Initialise equipped keys from real data once (avoids overwriting optimistic updates)
  useEffect(() => {
    if (realData && equippedKeys === null) {
      setEquippedKeys(new Set(realData.all_badges.filter(b => b.equipped).map(b => b.key)));
    }
  }, [realData, equippedKeys]);

  if (!row) return null;

  const mock = buildProfileMock(row, name, position);

  const mergedMock = {
    ...mock,
    ...(realData && {
      winrate:           realData.win_rate > 0          ? realData.win_rate          : mock.winrate,
      trades:            realData.total_operations > 0  ? realData.total_operations  : mock.trades,
      preferred_asset:   realData.preferred_asset       ?? mock.preferred_asset,
      score_variation:   realData.score_variation !== 0 ? realData.score_variation   : mock.score_variation,
      positive_days:     realData.positive_days > 0     ? realData.positive_days     : mock.positive_days,
      best_streak_gains: realData.best_gains_streak > 0 ? realData.best_gains_streak : mock.best_streak_gains,
      rank_change:       realData.rank_change,
    }),
  };

  // Build realBadges with local equipped-state overrides applied
  const realBadges: RealBadge[] | undefined = realData?.all_badges.map(b => ({
    key:         b.key,
    title:       b.title,
    rarity:      b.rarity,
    badge_group: b.badge_group,
    earned:      b.earned,
    equipped:    equippedKeys !== null ? equippedKeys.has(b.key) : b.equipped,
  }));

  async function handleToggleEquip(key: string, currentlyEquipped: boolean) {
    if (!isOwner || !currentUserId) return;
    if (!currentlyEquipped && (equippedKeys?.size ?? 0) >= 3) return; // max 3

    // Optimistic update
    setEquippedKeys(prev => {
      const next = new Set(prev ?? []);
      currentlyEquipped ? next.delete(key) : next.add(key);
      return next;
    });

    // Persist to DB
    await (supabase.from as any)("user_achievements")
      .update({ equipped: !currentlyEquipped })
      .eq("user_id", currentUserId)
      .eq("achievement_key", key);
  }

  const props = {
    row, position, name, mock: mergedMock,
    userId,
    isOwner, isAdmin, realBadges,
    onToggleEquip: handleToggleEquip,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-none bg-transparent p-0 shadow-none [&>button]:hidden">
        <ProfileTemplateB {...props} />
      </DialogContent>
    </Dialog>
  );
}
