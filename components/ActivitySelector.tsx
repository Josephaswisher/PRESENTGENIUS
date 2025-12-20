/**
 * ActivitySelector Component
 * Grid-based selector for 50+ medical education activity types
 * Part of VibePresenterPro
 */
import React, { useState } from 'react';
import { ACTIVITIES, ACTIVITY_TIERS, Activity, ActivityTier, LearnerLevel } from '../data/activities';

interface ActivitySelectorProps {
  selectedActivity: Activity | null;
  onSelectActivity: (activity: Activity | null) => void;
  learnerLevel?: LearnerLevel;
  disabled?: boolean;
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
  selectedActivity,
  onSelectActivity,
  learnerLevel,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTier, setActiveTier] = useState<ActivityTier | 'all'>('all');

  // Filter activities by tier and learner level
  const filteredActivities = ACTIVITIES.filter(activity => {
    const tierMatch = activeTier === 'all' || activity.tier === activeTier;
    const levelMatch = !learnerLevel || activity.learnerLevels.includes(learnerLevel);
    return tierMatch && levelMatch;
  });

  // Group activities by tier for organized display
  const activitiesByTier = ACTIVITY_TIERS.map(tier => ({
    ...tier,
    activities: filteredActivities.filter(a => a.tier === tier.id)
  })).filter(tier => tier.activities.length > 0);

  const handleSelect = (activity: Activity) => {
    if (disabled) return;
    if (selectedActivity?.id === activity.id) {
      onSelectActivity(null); // Deselect if clicking same
    } else {
      onSelectActivity(activity);
    }
    setIsExpanded(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectActivity(null);
  };

  return (
    <div className="relative">
      {/* Collapsed View - Selected Activity or Prompt */}
      <button
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-3
          bg-zinc-900/50 border border-zinc-800 rounded-xl
          text-left transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/50 hover:bg-zinc-900'}
          ${isExpanded ? 'border-cyan-500 ring-1 ring-cyan-500/20' : ''}
        `}
      >
        {selectedActivity ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{selectedActivity.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-zinc-100 font-medium truncate">{selectedActivity.name}</div>
              <div className="text-zinc-500 text-xs truncate">{selectedActivity.description}</div>
            </div>
            <button
              onClick={handleClear}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-zinc-500">
            <span className="text-xl">🎯</span>
            <span>Choose Activity Type (optional)</span>
          </div>
        )}
        <svg
          className={`w-5 h-5 text-zinc-500 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Grid */}
      {isExpanded && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
          {/* Tier Filter Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
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
                  <span className="text-zinc-600">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Activity Grid */}
          <div className="overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-700">
            {activeTier === 'all' ? (
              // Show all grouped by tier
              <div className="space-y-4">
                {activitiesByTier.map(tierGroup => (
                  <div key={tierGroup.id}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-sm">{tierGroup.icon}</span>
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {tierGroup.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {tierGroup.activities.map(activity => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          isSelected={selectedActivity?.id === activity.id}
                          onClick={() => handleSelect(activity)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Show filtered tier flat
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isSelected={selectedActivity?.id === activity.id}
                    onClick={() => handleSelect(activity)}
                  />
                ))}
              </div>
            )}

            {filteredActivities.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                No activities available for this learner level
              </div>
            )}
          </div>

          {/* Quick tip */}
          <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 text-center">
              Select an activity type to guide AI generation, or leave empty for auto-detect
            </p>
          </div>
        </div>
      )}

      {/* Backdrop to close */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

// Individual Activity Card
interface ActivityCardProps {
  activity: Activity;
  isSelected: boolean;
  onClick: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-start gap-2 p-3 rounded-lg text-left transition-all duration-150
        border
        ${isSelected
          ? 'bg-cyan-500/20 border-cyan-500/50 ring-1 ring-cyan-500/20'
          : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600'}
      `}
    >
      <span className="text-xl flex-shrink-0">{activity.icon}</span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${isSelected ? 'text-cyan-300' : 'text-zinc-200'}`}>
          {activity.name}
        </div>
        <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
          {activity.description}
        </div>
      </div>
    </button>
  );
};

export default ActivitySelector;
