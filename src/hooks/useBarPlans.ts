import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface BarPlanOption {
  id: string;
  plan_id: string;
  added_by: string;
  bar_name: string;
  bar_slug: string | null;
  address: string | null;
  emoji: string;
  created_at: string;
  vote_count: number;
  user_voted: boolean;
}

export interface BarPlan {
  id: string;
  crew_id: string;
  creator_id: string;
  title: string;
  notes: string;
  status: string;
  finalized_option_id: string | null;
  created_at: string;
  updated_at: string;
  options: BarPlanOption[];
  comment_count: number;
}

export interface BarPlanComment {
  id: string;
  plan_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: { display_name: string; profile_photo: string | null };
}

export function useBarPlans(crewId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!crewId) return;
    const channel = supabase
      .channel(`bar-plans-${crewId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_plans', filter: `crew_id=eq.${crewId}` }, () => {
        qc.invalidateQueries({ queryKey: ['bar-plans', crewId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_plan_options' }, () => {
        qc.invalidateQueries({ queryKey: ['bar-plans', crewId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_plan_votes' }, () => {
        qc.invalidateQueries({ queryKey: ['bar-plans', crewId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_plan_comments' }, () => {
        qc.invalidateQueries({ queryKey: ['bar-plans', crewId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [crewId, qc]);

  const query = useQuery({
    queryKey: ['bar-plans', crewId],
    enabled: !!crewId && !!user,
    queryFn: async (): Promise<BarPlan[]> => {
      if (!crewId) return [];
      const { data: plans } = await supabase
        .from('bar_plans')
        .select('*')
        .eq('crew_id', crewId)
        .order('created_at', { ascending: false });
      if (!plans?.length) return [];

      const planIds = plans.map(p => p.id);
      const [{ data: options }, { data: comments }] = await Promise.all([
        supabase.from('bar_plan_options').select('*').in('plan_id', planIds),
        supabase.from('bar_plan_comments').select('plan_id').in('plan_id', planIds),
      ]);

      const optionIds = options?.map(o => o.id) ?? [];
      const { data: votes } = optionIds.length
        ? await supabase.from('bar_plan_votes').select('*').in('option_id', optionIds)
        : { data: [] };

      const commentCounts = new Map<string, number>();
      comments?.forEach(c => commentCounts.set(c.plan_id, (commentCounts.get(c.plan_id) ?? 0) + 1));

      return plans.map(p => ({
        ...p,
        comment_count: commentCounts.get(p.id) ?? 0,
        options: (options ?? [])
          .filter(o => o.plan_id === p.id)
          .map(o => {
            const optVotes = (votes ?? []).filter(v => v.option_id === o.id);
            return {
              ...o,
              vote_count: optVotes.length,
              user_voted: optVotes.some(v => v.user_id === user?.id),
            };
          })
          .sort((a, b) => b.vote_count - a.vote_count || a.created_at.localeCompare(b.created_at)),
      }));
    },
  });

  const createPlan = useMutation({
    mutationFn: async ({ title, notes }: { title: string; notes?: string }) => {
      if (!user || !crewId) throw new Error('Not allowed');
      const { data, error } = await supabase
        .from('bar_plans')
        .insert({ crew_id: crewId, creator_id: user.id, title, notes: notes ?? '' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plans', crewId] }),
  });

  const addOption = useMutation({
    mutationFn: async (opt: { planId: string; bar_name: string; bar_slug?: string | null; address?: string | null; emoji?: string }) => {
      if (!user) throw new Error('Not logged in');
      const { error } = await supabase.from('bar_plan_options').insert({
        plan_id: opt.planId,
        added_by: user.id,
        bar_name: opt.bar_name,
        bar_slug: opt.bar_slug ?? null,
        address: opt.address ?? null,
        emoji: opt.emoji ?? '🍻',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plans', crewId] }),
  });

  const removeOption = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase.from('bar_plan_options').delete().eq('id', optionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plans', crewId] }),
  });

  const toggleVote = useMutation({
    mutationFn: async ({ optionId, currentlyVoted }: { optionId: string; currentlyVoted: boolean }) => {
      if (!user) throw new Error('Not logged in');
      if (currentlyVoted) {
        const { error } = await supabase.from('bar_plan_votes').delete().eq('option_id', optionId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bar_plan_votes').insert({ option_id: optionId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plans', crewId] }),
  });

  const finalizePlan = useMutation({
    mutationFn: async ({ planId, optionId }: { planId: string; optionId: string | null }) => {
      const { error } = await supabase
        .from('bar_plans')
        .update({ status: optionId ? 'finalized' : 'open', finalized_option_id: optionId })
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plans', crewId] }),
  });

  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from('bar_plans').delete().eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plans', crewId] }),
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    createPlan,
    addOption,
    removeOption,
    toggleVote,
    finalizePlan,
    deletePlan,
  };
}

export function useBarPlanComments(planId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['bar-plan-comments', planId],
    enabled: !!planId && !!user,
    queryFn: async (): Promise<BarPlanComment[]> => {
      if (!planId) return [];
      const { data: comments } = await supabase
        .from('bar_plan_comments')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });
      if (!comments?.length) return [];

      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase.rpc('get_public_profiles', { p_user_ids: userIds });
      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

      return comments.map(c => ({
        ...c,
        author: profileMap.get(c.user_id)
          ? { display_name: profileMap.get(c.user_id)!.display_name, profile_photo: profileMap.get(c.user_id)!.profile_photo }
          : undefined,
      }));
    },
  });

  const addComment = useMutation({
    mutationFn: async (body: string) => {
      if (!user || !planId) throw new Error('Not allowed');
      const { error } = await supabase.from('bar_plan_comments').insert({ plan_id: planId, user_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plan-comments', planId] }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('bar_plan_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-plan-comments', planId] }),
  });

  return { comments: query.data ?? [], isLoading: query.isLoading, addComment, deleteComment };
}
