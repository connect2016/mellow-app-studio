-- No schema change needed, game_status is already a text field
-- Just updating the comment for documentation
COMMENT ON COLUMN public.profiles.game_status IS 'User current status: AtWrigley, AtBar, Tailgating, WatchingRemote, NotSet';