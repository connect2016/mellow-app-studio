import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, X, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBucketList } from '@/hooks/useBucketList';
import { cn } from '@/lib/utils';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

function IvyCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'h-8 w-8 min-h-[32px] min-w-[32px] rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0',
        checked
          ? 'bg-[hsl(120,40%,35%)] border-[hsl(120,40%,25%)] scale-110'
          : 'border-[hsl(35,30%,60%)] bg-[hsl(40,40%,90%)] hover:border-[hsl(120,40%,35%)]'
      )}
      aria-label={checked ? 'Completed' : 'Mark complete'}
    >
      {checked ? (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="text-lg leading-none"
        >
          
        </motion.span>
      ) : null}
    </button>
  );
}

export function BucketListPanel() {
  const [open, setOpen] = useState(false);
  const {
    tasks, completedKeys, completeTask, uncompleteTask,
    allComplete, completedCount, totalCount, isLoading,
  } = useBucketList();

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 rounded-full shadow-xl gap-2 min-h-[56px] px-5"
        style={{
          background: 'linear-gradient(135deg, hsl(120,40%,35%), hsl(210,60%,30%))',
          fontFamily: "'Bungee', cursive",
        }}
      >
        <ClipboardList className="h-5 w-5" />
        <span className="text-sm">{completedCount}/{totalCount}</span>
      </Button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[101] w-[90vw] max-w-md flex flex-col shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, hsl(40, 35%, 92%) 0%, hsl(38, 30%, 85%) 100%)',
                borderLeft: '3px solid hsl(35, 30%, 65%)',
              }}
            >
              {/* Header */}
              <div className="px-5 pt-6 pb-3 flex items-start justify-between">
                <div>
                  <h2
                    className="text-xl font-extrabold tracking-wide"
                    style={{
                      fontFamily: "'Bungee', cursive",
                      color: 'hsl(210, 60%, 25%)',
                    }}
                  >
                     Field Guide
                  </h2>
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: 'hsl(35, 20%, 45%)', fontStyle: 'italic' }}
                  >
                    Wrigleyville Bucket List — Gameday Edition
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                >
                  <X className="h-5 w-5" style={{ color: 'hsl(35, 20%, 40%)' }} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mx-5 mb-4">
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsl(35, 25%, 78%)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, hsl(120,45%,40%), hsl(120,50%,30%))' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs mt-1 text-right font-semibold" style={{ color: 'hsl(120,40%,30%)' }}>
                  {completedCount} / {totalCount} complete
                </p>
              </div>

              {/* Tasks list */}
              <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
                {tasks.map((task) => {
                  const done = completedKeys.has(task.key);
                  return (
                    <motion.div
                      key={task.key}
                      layout
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border transition-all',
                        done
                          ? 'bg-[hsl(120,30%,92%)] border-[hsl(120,30%,75%)]'
                          : 'bg-white/70 border-[hsl(35,25%,78%)]'
                      )}
                      style={{
                        boxShadow: done ? 'none' : '0 1px 4px hsl(35 25% 70% / 0.3)',
                      }}
                    >
                      <IvyCheckbox
                        checked={done}
                        onToggle={() => {
                          if (done) {
                            uncompleteTask.mutate(task.key);
                          } else {
                            completeTask.mutate(task.key);
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-bold leading-tight',
                            done && 'line-through opacity-60'
                          )}
                          style={{ color: 'hsl(210, 50%, 20%)' }}
                        >
                          <ConceptVisual name={task.emoji} size="sm" /> {task.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(35, 20%, 45%)' }}>
                          {task.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Completion celebration */}
                <AnimatePresence>
                  {allComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl text-center border-2"
                      style={{
                        background: 'linear-gradient(135deg, hsl(45, 80%, 55%), hsl(35, 70%, 50%))',
                        borderColor: 'hsl(35, 60%, 40%)',
                      }}
                    >
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-white" />
                      <p className="text-base font-extrabold text-white" style={{ fontFamily: "'Bungee', cursive" }}>
                        Gameday Legend!
                      </p>
                      <p className="text-xs text-white/90 mt-1">
                        Your badge is active for the next 24 hours. +5 Ivy Leaves earned!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
