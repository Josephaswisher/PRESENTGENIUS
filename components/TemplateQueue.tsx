/**
 * TemplateQueue Component
 * Allows users to browse templates and add multiple to a queue
 * for creating mixed-format presentations
 */
import React, { useState } from 'react';
import { ACTIVITIES, ACTIVITY_TIERS, Activity, ActivityTier, LearnerLevel } from '../data/activities';
import { PlusIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, TrashIcon } from '@heroicons/react/24/solid';

export interface QueuedTemplate {
  id: string;
  activity: Activity;
  slideCount: number;
  notes?: string;
}

interface TemplateQueueProps {
  queue: QueuedTemplate[];
  onUpdateQueue: (queue: QueuedTemplate[]) => void;
  learnerLevel?: LearnerLevel;
  disabled?: boolean;
}

export const TemplateQueue: React.FC<TemplateQueueProps> = ({
  queue,
  onUpdateQueue,
  learnerLevel,
  disabled = false
}) => {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<ActivityTier | 'all'>('all');
  const [slideCountInput, setSlideCountInput] = useState<{ [key: string]: number }>({});

  // Filter activities by tier and learner level
  const filteredActivities = ACTIVITIES.filter(activity => {
    const tierMatch = activeTier === 'all' || activity.tier === activeTier;
    const levelMatch = !learnerLevel || activity.learnerLevels.includes(learnerLevel);
    return tierMatch && levelMatch;
  });

  // Group by tier
  const activitiesByTier = ACTIVITY_TIERS.map(tier => ({
    ...tier,
    activities: filteredActivities.filter(a => a.tier === tier.id)
  })).filter(tier => tier.activities.length > 0);

  const addToQueue = (activity: Activity) => {
    const count = slideCountInput[activity.id] || 1;
    const newItem: QueuedTemplate = {
      id: crypto.randomUUID(),
      activity,
      slideCount: count,
    };
    onUpdateQueue([...queue, newItem]);
    setSlideCountInput(prev => ({ ...prev, [activity.id]: 1 }));
  };

  const removeFromQueue = (id: string) => {
    onUpdateQueue(queue.filter(item => item.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newQueue = [...queue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    onUpdateQueue(newQueue);
  };

  const moveDown = (index: number) => {
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    onUpdateQueue(newQueue);
  };

  const updateSlideCount = (id: string, count: number) => {
    onUpdateQueue(queue.map(item => 
      item.id === id ? { ...item, slideCount: Math.max(1, count) } : item
    ));
  };

  const clearQueue = () => {
    onUpdateQueue([]);
  };

  const totalSlides = queue.reduce((sum, item) => sum + item.slideCount, 0);

  return (
    <div className="w-full">
      {/* Queue Display */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <span>🎯 Template Queue</span>
            {queue.length > 0 && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                {queue.length} templates • {totalSlides} slides
              </span>
            )}
          </h3>
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <TrashIcon className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>

        {/* Queued Items */}
        {queue.length === 0 ? (
          <div className="border border-dashed border-zinc-700 rounded-lg p-4 text-center">
            <p className="text-zinc-500 text-sm">No templates in queue</p>
            <p className="text-zinc-600 text-xs mt-1">Add templates to create a mixed presentation</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {queue.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-lg p-2 group"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUpIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === queue.length - 1}
                    className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Activity info */}
                <span className="text-lg">{item.activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{item.activity.name}</div>
                </div>

                {/* Slide count */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateSlideCount(item.id, item.slideCount - 1)}
                    className="w-5 h-5 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs text-zinc-400 w-8 text-center">{item.slideCount}</span>
                  <button
                    onClick={() => updateSlideCount(item.id, item.slideCount + 1)}
                    className="w-5 h-5 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromQueue(item.id)}
                  className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Browse Templates Button */}
      <button
        onClick={() => !disabled && setIsBrowserOpen(!isBrowserOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3
          bg-gradient-to-r from-cyan-500/10 to-blue-500/10 
          border border-cyan-500/30 rounded-xl
          text-cyan-400 font-medium
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/50 hover:from-cyan-500/20 hover:to-blue-500/20'}
        `}
      >
        <PlusIcon className="w-5 h-5" />
        <span>Browse & Add Templates</span>
      </button>

      {/* Template Browser Modal */}
      {isBrowserOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsBrowserOpen(false)}
          />
          <div className="fixed inset-4 md:inset-10 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">Browse Templates</h2>
              <button
                onClick={() => setIsBrowserOpen(false)}
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-1 p-3 border-b border-zinc-800 overflow-x-auto">
              <button
                onClick={() => setActiveTier('all')}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                  ${activeTier === 'all'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}
                `}
              >
                All ({filteredActivities.length})
              </button>
              {ACTIVITY_TIERS.map(tier => {
                const count = ACTIVITIES.filter(a => {
                  const tierMatch = a.tier === tier.id;
                  const levelMatch = !learnerLevel || a.learnerLevels.includes(learnerLevel);
                  return tierMatch && levelMatch;
                }).length;
                if (count === 0) return null;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setActiveTier(tier.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5
                      ${activeTier === tier.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}
                    `}
                  >
                    <span>{tier.icon}</span>
                    <span>{tier.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Activity Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTier === 'all' ? (
                <div className="space-y-6">
                  {activitiesByTier.map(tierGroup => (
                    <div key={tierGroup.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{tierGroup.icon}</span>
                        <span className="text-sm font-medium text-zinc-300">{tierGroup.name}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tierGroup.activities.map(activity => (
                          <TemplateBrowserCard
                            key={activity.id}
                            activity={activity}
                            slideCount={slideCountInput[activity.id] || 1}
                            onSlideCountChange={(count) => setSlideCountInput(prev => ({ ...prev, [activity.id]: count }))}
                            onAdd={() => addToQueue(activity)}
                            isInQueue={queue.some(q => q.activity.id === activity.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredActivities.map(activity => (
                    <TemplateBrowserCard
                      key={activity.id}
                      activity={activity}
                      slideCount={slideCountInput[activity.id] || 1}
                      onSlideCountChange={(count) => setSlideCountInput(prev => ({ ...prev, [activity.id]: count }))}
                      onAdd={() => addToQueue(activity)}
                      isInQueue={queue.some(q => q.activity.id === activity.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  {queue.length > 0 ? (
                    <span>{queue.length} templates selected • {totalSlides} total slides</span>
                  ) : (
                    <span>Click + to add templates to your queue</span>
                  )}
                </div>
                <button
                  onClick={() => setIsBrowserOpen(false)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-900 font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Card for browser modal
interface TemplateBrowserCardProps {
  activity: Activity;
  slideCount: number;
  onSlideCountChange: (count: number) => void;
  onAdd: () => void;
  isInQueue: boolean;
}

const TemplateBrowserCard: React.FC<TemplateBrowserCardProps> = ({
  activity,
  slideCount,
  onSlideCountChange,
  onAdd,
  isInQueue
}) => {
  return (
    <div className={`
      p-4 rounded-xl border transition-all
      ${isInQueue 
        ? 'bg-cyan-500/10 border-cyan-500/30' 
        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}
    `}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{activity.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-100">{activity.name}</div>
          <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{activity.description}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Slide count selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Slides:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSlideCountChange(Math.max(1, slideCount - 1))}
              className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
            >
              -
            </button>
            <span className="text-sm text-zinc-300 w-6 text-center">{slideCount}</span>
            <button
              onClick={() => onSlideCountChange(slideCount + 1)}
              className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={onAdd}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${isInQueue
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-900'}
          `}
        >
          <PlusIcon className="w-3 h-3" />
          {isInQueue ? 'Add Another' : 'Add'}
        </button>
      </div>
    </div>
  );
};

export default TemplateQueue;
