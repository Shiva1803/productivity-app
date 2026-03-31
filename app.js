// StorageModule - Hybrid localStorage + Supabase storage
const StorageModule = (() => {
  // Local storage fallback
  const getItemLocal = (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  };

  const setItemLocal = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  };

  const shouldSyncToCloud = (key) => [
    'timerState',
    'analytics',
    'theme',
    'todoItems',
    'notesItems',
    'timerTags',
    'activeTimerTagId',
    'sessionLogs',
    'customPresets',
    'shortcutConfig',
    'weeklyGoalHours',
    'todoDisposableMode',
    'focusLockEnabled',
    'focusLockAutoActivate'
  ].includes(key);

  // Supabase operations
  const getItem = async (key) => {
    // Try local first for instant load
    const localData = getItemLocal(key);

    if (!shouldSyncToCloud(key)) {
      return localData;
    }
    
    // Then sync from Supabase in background
    try {
      const userId = getUserId();
      
      if (key === 'timerState') {
        const { data, error } = await supabase
          .from('timer_states')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data && !error) {
          const timerData = {
            totalSeconds: data.total_seconds,
            paused: data.paused
          };
          setItemLocal(key, timerData);
          return timerData;
        }
      } else if (key === 'analytics') {
        const { data, error } = await supabase
          .from('analytics')
          .select('*')
          .eq('user_id', userId);
        
        if (data && !error) {
          const analyticsData = {};
          data.forEach(row => {
            analyticsData[row.date] = {
              timeSpent: row.time_spent,
              sessions: row.sessions
            };
          });
          setItemLocal(key, analyticsData);
          return analyticsData;
        }
      } else if (key === 'theme') {
        const { data, error } = await supabase
          .from('theme_preferences')
          .select('theme')
          .eq('user_id', userId)
          .single();
        
        if (data && !error) {
          setItemLocal(key, data.theme);
          return data.theme;
        }
      } else if (key === 'todoItems') {
        const { data, error } = await supabase
          .from('todo_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(250);
        
        if (data && !error) {
          const todoItems = data.map(row => ({
            id: row.item_id,
            text: row.text,
            completed: row.completed,
            tagId: row.tag_id,
            createdAt: row.created_at
          }));
          setItemLocal(key, todoItems);
          return todoItems;
        }
      } else if (key === 'notesItems') {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(500);
        
        if (data && !error) {
          const notes = data.map(row => ({
            id: row.note_id,
            content: row.content,
            tagId: row.tag_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          setItemLocal(key, notes);
          return notes;
        }
      } else if (key === 'timerTags') {
        const { data, error } = await supabase
          .from('timer_tags')
          .select('*')
          .eq('user_id', userId)
          .limit(30);
        
        if (data && !error) {
          const tags = data.map(row => ({
            id: row.tag_id,
            name: row.name,
            colorId: row.color_id,
            system: row.system_flag
          }));
          setItemLocal(key, tags);
          return tags;
        }
      } else if (key === 'activeTimerTagId') {
        const { data, error } = await supabase
          .from('active_timer_tag')
          .select('tag_id')
          .eq('user_id', userId)
          .single();
        
        if (data && !error) {
          setItemLocal(key, data.tag_id);
          return data.tag_id;
        }
      } else if (key === 'sessionLogs') {
        const { data, error } = await supabase
          .from('session_logs')
          .select('*')
          .eq('user_id', userId)
          .order('start_time', { ascending: true })
          .limit(10000);
        
        if (data && !error) {
          const logs = data.map(row => ({
            id: row.session_id,
            startTime: row.start_time,
            endTime: row.end_time,
            durationSeconds: row.duration_seconds,
            tagId: row.tag_id
          }));
          setItemLocal(key, logs);
          return logs;
        }
      } else if (key === 'customPresets') {
        const { data, error } = await supabase
          .from('custom_presets')
          .select('*')
          .eq('user_id', userId)
          .limit(6);
        
        if (data && !error) {
          const presets = data.map(row => ({
            id: row.preset_id,
            label: row.label,
            minutes: row.duration_minutes
          }));
          setItemLocal(key, presets);
          return presets;
        }
      } else if (key === 'shortcutConfig') {
        const { data, error } = await supabase
          .from('keyboard_shortcuts')
          .select('config_json')
          .eq('user_id', userId)
          .single();
        
        if (data && !error) {
          setItemLocal(key, data.config_json);
          return data.config_json;
        }
      } else if (key === 'weeklyGoalHours') {
        const { data, error } = await supabase
          .from('weekly_goals')
          .select('goal_hours')
          .eq('user_id', userId)
          .single();
        
        if (data && !error) {
          setItemLocal(key, data.goal_hours);
          return data.goal_hours;
        }
      } else if (key === 'todoDisposableMode') {
        const { data, error } = await supabase
          .from('disposable_mode')
          .select('enabled')
          .eq('user_id', userId)
          .single();
        
        if (data && !error) {
          setItemLocal(key, data.enabled);
          return data.enabled;
        }
      } else if (key === 'focusLockEnabled' || key === 'focusLockAutoActivate') {
        const { data, error } = await supabase
          .from('focus_lock_preferences')
          .select('enabled, auto_activate')
          .eq('user_id', userId)
          .single();
        
        if (data && !error) {
          if (key === 'focusLockEnabled') {
            setItemLocal(key, data.enabled);
            return data.enabled;
          } else {
            setItemLocal(key, data.auto_activate);
            return data.auto_activate;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading from Supabase (${key}):`, error);
    }
    
    return localData;
  };

  const isAnalyticsEntryEqual = (firstEntry, secondEntry) =>
    Number(firstEntry?.timeSpent || 0) === Number(secondEntry?.timeSpent || 0)
    && Number(firstEntry?.sessions || 0) === Number(secondEntry?.sessions || 0);

  const detectTodoChanges = (previousItems, nextItems) => {
    const previousMap = new Map(previousItems.map(item => [item.id, item]));
    const nextMap = new Map(nextItems.map(item => [item.id, item]));
    
    const added = [];
    const updated = [];
    const deleted = [];
    
    // Find added and updated items
    nextItems.forEach(item => {
      const prev = previousMap.get(item.id);
      if (!prev) {
        added.push(item);
      } else if (
        prev.text !== item.text ||
        prev.completed !== item.completed ||
        prev.tagId !== item.tagId
      ) {
        updated.push(item);
      }
    });
    
    // Find deleted items
    previousItems.forEach(item => {
      if (!nextMap.has(item.id)) {
        deleted.push(item);
      }
    });
    
    return { added, updated, deleted };
  };

  const detectNotesChanges = (previousNotes, nextNotes) => {
    const previousMap = new Map(previousNotes.map(note => [note.id, note]));
    const nextMap = new Map(nextNotes.map(note => [note.id, note]));
    
    const added = [];
    const updated = [];
    const deleted = [];
    
    nextNotes.forEach(note => {
      const prev = previousMap.get(note.id);
      if (!prev) {
        added.push(note);
      } else if (
        prev.content !== note.content ||
        prev.tagId !== note.tagId
      ) {
        updated.push(note);
      }
    });
    
    previousNotes.forEach(note => {
      if (!nextMap.has(note.id)) {
        deleted.push(note);
      }
    });
    
    return { added, updated, deleted };
  };

  const detectTagChanges = (previousTags, nextTags) => {
    const previousMap = new Map(previousTags.map(tag => [tag.id, tag]));
    const nextMap = new Map(nextTags.map(tag => [tag.id, tag]));
    
    const added = [];
    const updated = [];
    const deleted = [];
    
    nextTags.forEach(tag => {
      const prev = previousMap.get(tag.id);
      if (!prev) {
        added.push(tag);
      } else if (
        prev.name !== tag.name ||
        prev.colorId !== tag.colorId
      ) {
        updated.push(tag);
      }
    });
    
    previousTags.forEach(tag => {
      if (!nextMap.has(tag.id)) {
        deleted.push(tag);
      }
    });
    
    return { added, updated, deleted };
  };

  const detectSessionLogChanges = (previousLogs, nextLogs) => {
    const previousIds = new Set(previousLogs.map(log => log.id));
    const nextIds = new Set(nextLogs.map(log => log.id));
    
    const added = nextLogs.filter(log => !previousIds.has(log.id));
    const deleted = previousLogs.filter(log => !nextIds.has(log.id));
    
    return { added, deleted };
  };

  const detectPresetChanges = (previousPresets, nextPresets) => {
    const previousIds = new Set(previousPresets.map(preset => preset.id));
    const nextIds = new Set(nextPresets.map(preset => preset.id));
    
    const added = nextPresets.filter(preset => !previousIds.has(preset.id));
    const deleted = previousPresets.filter(preset => !nextIds.has(preset.id));
    
    return { added, deleted };
  };

  const setItem = async (key, value, options = {}) => {
    const { syncCloud = true } = options;
    const previousLocal = getItemLocal(key);

    // Save locally first for instant response
    setItemLocal(key, value);

    if (!shouldSyncToCloud(key) || !syncCloud) {
      return;
    }
    
    // Then sync to Supabase
    try {
      const userId = getUserId();
      
      if (key === 'timerState') {
        if (
          previousLocal
          && previousLocal.totalSeconds === value.totalSeconds
          && previousLocal.paused === value.paused
        ) {
          return;
        }

        await supabase
          .from('timer_states')
          .upsert({
            user_id: userId,
            total_seconds: value.totalSeconds,
            paused: value.paused,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } else if (key === 'analytics') {
        const previousAnalytics = previousLocal && typeof previousLocal === 'object' ? previousLocal : {};
        const nextAnalytics = value && typeof value === 'object' ? value : {};

        const changedDates = Object.keys(nextAnalytics).filter((date) =>
          !isAnalyticsEntryEqual(previousAnalytics[date], nextAnalytics[date])
        );
        const removedDates = Object.keys(previousAnalytics).filter((date) => !(date in nextAnalytics));

        for (const date of changedDates) {
          const entry = nextAnalytics[date];
          await supabase
            .from('analytics')
            .upsert({
              user_id: userId,
              date,
              time_spent: Number(entry.timeSpent || 0),
              sessions: Number(entry.sessions || 0),
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,date' });
        }

        if (removedDates.length > 0) {
          await supabase
            .from('analytics')
            .delete()
            .eq('user_id', userId)
            .in('date', removedDates);
        }
      } else if (key === 'theme') {
        if (previousLocal === value) {
          return;
        }

        await supabase
          .from('theme_preferences')
          .upsert({
            user_id: userId,
            theme: value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } else if (key === 'todoItems') {
        const previousItems = previousLocal || [];
        const nextItems = value || [];
        
        // Detect changes
        const changes = detectTodoChanges(previousItems, nextItems);
        
        if (changes.added.length === 0 && changes.updated.length === 0 && changes.deleted.length === 0) {
          return; // No changes to sync
        }
        
        // Batch upsert added/updated items
        if (changes.added.length > 0 || changes.updated.length > 0) {
          const itemsToUpsert = [...changes.added, ...changes.updated].map(item => ({
            user_id: userId,
            item_id: item.id,
            text: item.text,
            completed: item.completed,
            tag_id: item.tagId,
            created_at: item.createdAt,
            updated_at: new Date().toISOString()
          }));
          
          await supabase
            .from('todo_items')
            .upsert(itemsToUpsert, { onConflict: 'user_id,item_id' });
        }
        
        // Batch delete removed items
        if (changes.deleted.length > 0) {
          const itemIds = changes.deleted.map(item => item.id);
          await supabase
            .from('todo_items')
            .delete()
            .eq('user_id', userId)
            .in('item_id', itemIds);
        }
      } else if (key === 'notesItems') {
        const previousNotes = previousLocal || [];
        const nextNotes = value || [];
        
        // Detect changes
        const changes = detectNotesChanges(previousNotes, nextNotes);
        
        if (changes.added.length === 0 && changes.updated.length === 0 && changes.deleted.length === 0) {
          return; // No changes to sync
        }
        
        // Batch upsert added/updated notes
        if (changes.added.length > 0 || changes.updated.length > 0) {
          const notesToUpsert = [...changes.added, ...changes.updated].map(note => ({
            user_id: userId,
            note_id: note.id,
            content: note.content,
            tag_id: note.tagId,
            created_at: note.createdAt,
            updated_at: new Date().toISOString()
          }));
          
          await supabase
            .from('notes')
            .upsert(notesToUpsert, { onConflict: 'user_id,note_id' });
        }
        
        // Batch delete removed notes
        if (changes.deleted.length > 0) {
          const noteIds = changes.deleted.map(note => note.id);
          await supabase
            .from('notes')
            .delete()
            .eq('user_id', userId)
            .in('note_id', noteIds);
        }
      } else if (key === 'timerTags') {
        const previousTags = previousLocal || [];
        const nextTags = value || [];
        
        // Detect changes
        const changes = detectTagChanges(previousTags, nextTags);
        
        if (changes.added.length === 0 && changes.updated.length === 0 && changes.deleted.length === 0) {
          return; // No changes to sync
        }
        
        // Batch upsert added/updated tags
        if (changes.added.length > 0 || changes.updated.length > 0) {
          const tagsToUpsert = [...changes.added, ...changes.updated].map(tag => ({
            user_id: userId,
            tag_id: tag.id,
            name: tag.name,
            color_id: tag.colorId,
            system_flag: tag.system || false,
            updated_at: new Date().toISOString()
          }));
          
          await supabase
            .from('timer_tags')
            .upsert(tagsToUpsert, { onConflict: 'user_id,tag_id' });
        }
        
        // Batch delete removed tags
        if (changes.deleted.length > 0) {
          const tagIds = changes.deleted.map(tag => tag.id);
          await supabase
            .from('timer_tags')
            .delete()
            .eq('user_id', userId)
            .in('tag_id', tagIds);
        }
      } else if (key === 'activeTimerTagId') {
        if (previousLocal === value) {
          return; // No change to sync
        }
        
        await supabase
          .from('active_timer_tag')
          .upsert({
            user_id: userId,
            tag_id: value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } else if (key === 'sessionLogs') {
        const previousLogs = previousLocal || [];
        const nextLogs = value || [];
        
        // Detect changes
        const changes = detectSessionLogChanges(previousLogs, nextLogs);
        
        if (changes.added.length === 0 && changes.deleted.length === 0) {
          return; // No changes to sync
        }
        
        // Batch insert added logs
        if (changes.added.length > 0) {
          const logsToInsert = changes.added.map(log => ({
            user_id: userId,
            session_id: log.id,
            start_time: log.startTime,
            end_time: log.endTime,
            duration_seconds: log.durationSeconds,
            tag_id: log.tagId,
            created_at: new Date().toISOString()
          }));
          
          await supabase
            .from('session_logs')
            .upsert(logsToInsert, { onConflict: 'user_id,session_id' });
        }
        
        // Batch delete removed logs
        if (changes.deleted.length > 0) {
          const sessionIds = changes.deleted.map(log => log.id);
          await supabase
            .from('session_logs')
            .delete()
            .eq('user_id', userId)
            .in('session_id', sessionIds);
        }
      } else if (key === 'customPresets') {
        const previousPresets = previousLocal || [];
        const nextPresets = value || [];
        
        // Detect changes
        const changes = detectPresetChanges(previousPresets, nextPresets);
        
        if (changes.added.length === 0 && changes.deleted.length === 0) {
          return; // No changes to sync
        }
        
        // Batch upsert added presets
        if (changes.added.length > 0) {
          const presetsToUpsert = changes.added.map(preset => ({
            user_id: userId,
            preset_id: preset.id,
            label: preset.label,
            duration_minutes: preset.minutes,
            updated_at: new Date().toISOString()
          }));
          
          await supabase
            .from('custom_presets')
            .upsert(presetsToUpsert, { onConflict: 'user_id,preset_id' });
        }
        
        // Batch delete removed presets
        if (changes.deleted.length > 0) {
          const presetIds = changes.deleted.map(preset => preset.id);
          await supabase
            .from('custom_presets')
            .delete()
            .eq('user_id', userId)
            .in('preset_id', presetIds);
        }
      } else if (key === 'shortcutConfig') {
        // Skip sync if config hasn't changed
        if (previousLocal && JSON.stringify(previousLocal) === JSON.stringify(value)) {
          return;
        }
        
        await supabase
          .from('keyboard_shortcuts')
          .upsert({
            user_id: userId,
            config_json: value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } else if (key === 'weeklyGoalHours') {
        // Skip sync if value hasn't changed
        if (previousLocal === value) {
          return;
        }
        
        await supabase
          .from('weekly_goals')
          .upsert({
            user_id: userId,
            goal_hours: value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } else if (key === 'todoDisposableMode') {
        // Skip sync if value hasn't changed
        if (previousLocal === value) {
          return;
        }
        
        await supabase
          .from('disposable_mode')
          .upsert({
            user_id: userId,
            enabled: value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } else if (key === 'focusLockEnabled' || key === 'focusLockAutoActivate') {
        // For Focus Lock, we need to handle both keys together
        // Get current values from localStorage
        const currentEnabled = key === 'focusLockEnabled' ? value : getItemLocal('focusLockEnabled');
        const currentAutoActivate = key === 'focusLockAutoActivate' ? value : getItemLocal('focusLockAutoActivate');
        
        // Skip sync if value hasn't changed
        if (key === 'focusLockEnabled' && previousLocal === value) {
          return;
        }
        if (key === 'focusLockAutoActivate' && previousLocal === value) {
          return;
        }
        
        await supabase
          .from('focus_lock_preferences')
          .upsert({
            user_id: userId,
            enabled: currentEnabled !== null ? currentEnabled : false,
            auto_activate: currentAutoActivate !== null ? currentAutoActivate : false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.error(`Error writing to Supabase (${key}):`, error);
    }
  };

  const removeItem = async (key) => {
    try {
      localStorage.removeItem(key);
      // Optionally delete from Supabase too
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  };

  return {
    getItem,
    getItemLocalSync: getItemLocal,
    setItem,
    removeItem
  };
})();

// DebouncerModule - Debouncing utility for performance optimization
const DebouncerModule = (() => {
  const timers = new Map();

  const createDebouncer = (delay = 500) => {
    return (key, fn) => {
      // Clear existing timer for this key
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
      }

      // Set new timer
      const timer = setTimeout(() => {
        timers.delete(key);
        fn();
      }, delay);

      timers.set(key, timer);
    };
  };

  return {
    createDebouncer
  };
})();

// RetryModule - Exponential backoff retry logic for Supabase operations
const RetryModule = (() => {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const withRetry = async (fn, retries = MAX_RETRIES) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === retries) {
          // All retries exhausted, throw error
          throw error;
        }
        
        // Calculate exponential backoff delay
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  };

  return {
    withRetry
  };
})();

// MigrationModule - One-time data migration from localStorage to Supabase
const MigrationModule = (() => {
  const MIGRATION_FLAG_KEY = 'dataMigrationCompleted';
  const DATA_TYPES_TO_MIGRATE = [
    'todoItems',
    'notesItems',
    'timerTags',
    'activeTimerTagId',
    'sessionLogs',
    'customPresets',
    'shortcutConfig',
    'weeklyGoalHours',
    'todoDisposableMode',
    'focusLockEnabled',
    'focusLockAutoActivate'
  ];

  const checkMigrationNeeded = () => {
    const flag = StorageModule.getItemLocalSync(MIGRATION_FLAG_KEY);
    return !flag; // Return true if flag doesn't exist (migration needed)
  };

  const migrateDataType = async (dataType) => {
    try {
      const data = StorageModule.getItemLocalSync(dataType);
      
      // Only migrate if data exists
      if (data !== null && data !== undefined) {
        console.log(`Migrating ${dataType}...`);
        await StorageModule.setItem(dataType, data, { syncCloud: true });
        console.log(`✓ Migrated ${dataType}`);
        return { success: true, dataType };
      } else {
        console.log(`⊘ Skipped ${dataType} (no data)`);
        return { success: true, dataType, skipped: true };
      }
    } catch (error) {
      console.error(`✗ Failed to migrate ${dataType}:`, error);
      return { success: false, dataType, error };
    }
  };

  const runMigration = async () => {
    if (!checkMigrationNeeded()) {
      console.log('Migration already completed, skipping...');
      return { alreadyCompleted: true };
    }

    console.log('Starting data migration to Supabase...');
    const results = [];
    
    for (const dataType of DATA_TYPES_TO_MIGRATE) {
      const result = await migrateDataType(dataType);
      results.push(result);
      
      // Add 100ms delay between migrations to avoid overwhelming API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if all migrations succeeded
    const allSucceeded = results.every(r => r.success);
    
    if (allSucceeded) {
      // Set migration flag
      StorageModule.getItemLocalSync(MIGRATION_FLAG_KEY); // Just to ensure it's accessible
      localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify(true));
      console.log('✓ Migration completed successfully!');
      return { success: true, results };
    } else {
      console.log('✗ Migration completed with errors. Will retry on next load.');
      return { success: false, results };
    }
  };

  return {
    runMigration,
    checkMigrationNeeded
  };
})();

const MAX_TIMER_HOURS = 1930;
const MAX_TIMER_SECONDS = MAX_TIMER_HOURS * 3600;
const MAX_PRESET_MINUTES = MAX_TIMER_HOURS * 60;

// TagsModule - Shared tags for timer sessions and to-do items
const TagsModule = (() => {
  const TAGS_STORAGE_KEY = 'timerTags';
  const ACTIVE_TAG_STORAGE_KEY = 'activeTimerTagId';
  const MAX_TAGS = 30;
  const UNTAGGED_ID = 'tag-untagged';
  const COLOR_OPTIONS = [
    { id: 'red', label: 'Red', hex: '#d32f2f' },
    { id: 'orange', label: 'Orange', hex: '#ef6c00' },
    { id: 'yellow', label: 'Yellow', hex: '#f9a825' },
    { id: 'green', label: 'Green', hex: '#2e7d32' },
    { id: 'teal', label: 'Teal', hex: '#00897b' },
    { id: 'blue', label: 'Blue', hex: '#1565c0' },
    { id: 'indigo', label: 'Indigo', hex: '#3949ab' },
    { id: 'pink', label: 'Pink', hex: '#ad1457' },
    { id: 'brown', label: 'Brown', hex: '#6d4c41' },
    { id: 'gray', label: 'Gray', hex: '#616161' }
  ];
  const DEFAULT_TAGS = [
    { id: UNTAGGED_ID, name: 'Untagged', colorId: 'gray', system: true },
    { id: 'tag-work', name: 'Work', colorId: 'blue' },
    { id: 'tag-study', name: 'Study', colorId: 'green' },
    { id: 'tag-gym', name: 'Gym', colorId: 'orange' }
  ];

  let tags = [...DEFAULT_TAGS];
  let activeTimerTagId = UNTAGGED_ID;
  let listenersBound = false;

  const createTagId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `tag-${crypto.randomUUID()}`;
    }
    return `tag-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  };

  const normalizeTagName = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').slice(0, 20);
  };

  const getColorOption = (colorId) => COLOR_OPTIONS.find((option) => option.id === colorId) || COLOR_OPTIONS[0];

  const ensureUntaggedTag = (sourceTags) => {
    const existing = sourceTags.find((tag) => tag.id === UNTAGGED_ID);
    if (!existing) {
      return [
        { id: UNTAGGED_ID, name: 'Untagged', colorId: 'gray', system: true },
        ...sourceTags
      ];
    }

    return sourceTags.map((tag) => {
      if (tag.id !== UNTAGGED_ID) return tag;
      return {
        ...tag,
        name: 'Untagged',
        system: true
      };
    });
  };

  const sanitizeTags = (rawTags) => {
    if (!Array.isArray(rawTags)) {
      return [...DEFAULT_TAGS];
    }

    const seenIds = new Set();
    const seenNames = new Set();
    const normalized = rawTags
      .filter((tag) => tag && typeof tag === 'object')
      .map((tag) => {
        let id = typeof tag.id === 'string' ? tag.id.trim() : '';
        if (!id || seenIds.has(id)) {
          id = createTagId();
        }

        const name = normalizeTagName(tag.name);
        if (!name) return null;

        const normalizedNameKey = name.toLowerCase();
        if (seenNames.has(normalizedNameKey)) return null;

        seenIds.add(id);
        seenNames.add(normalizedNameKey);
        return {
          id,
          name,
          colorId: getColorOption(tag.colorId).id,
          system: id === UNTAGGED_ID
        };
      })
      .filter(Boolean)
      .slice(0, MAX_TAGS);

    return ensureUntaggedTag(normalized);
  };

  const sanitizeActiveTagId = (candidateTagId, availableTags) => {
    if (typeof candidateTagId !== 'string') return UNTAGGED_ID;
    const found = availableTags.find((tag) => tag.id === candidateTagId);
    return found ? found.id : UNTAGGED_ID;
  };

  const resolveTagId = (tagId) => sanitizeActiveTagId(tagId, tags);

  const getTagById = (tagId) => tags.find((tag) => tag.id === resolveTagId(tagId)) || tags[0];
  const getTagColor = (tagId) => getColorOption(getTagById(tagId).colorId).hex;
  const getTagName = (tagId) => getTagById(tagId).name;

  const setFeedback = (message = '') => {
    const feedback = document.getElementById('tagFeedback');
    if (feedback) {
      feedback.textContent = message;
    }
  };

  const emitUpdated = () => {
    document.dispatchEvent(new CustomEvent('tags:updated', {
      detail: {
        tags: tags.map((tag) => ({ ...tag, colorHex: getColorOption(tag.colorId).hex })),
        activeTimerTagId
      }
    }));
  };

  const persist = async () => {
    await Promise.all([
      StorageModule.setItem(TAGS_STORAGE_KEY, tags),
      StorageModule.setItem(ACTIVE_TAG_STORAGE_KEY, activeTimerTagId)
    ]);
  };

  const fillColorSelect = (selectEl, selectedColorId = COLOR_OPTIONS[0].id) => {
    if (!selectEl) return;
    selectEl.innerHTML = '';

    COLOR_OPTIONS.forEach((color) => {
      const option = document.createElement('option');
      option.value = color.id;
      option.textContent = color.label;
      selectEl.appendChild(option);
    });
    selectEl.value = getColorOption(selectedColorId).id;
  };

  const fillTagSelect = (selectEl, options = {}) => {
    if (!selectEl) return;
    const {
      includeAllOption = false,
      allLabel = 'All Tags',
      selectedValue = null
    } = options;

    selectEl.innerHTML = '';
    if (includeAllOption) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = allLabel;
      selectEl.appendChild(allOption);
    }

    tags.forEach((tag) => {
      const option = document.createElement('option');
      const colorLabel = getColorOption(tag.colorId).label;
      option.value = tag.id;
      option.textContent = `${tag.name} (${colorLabel})`;
      selectEl.appendChild(option);
    });

    if (selectedValue && [...selectEl.options].some((option) => option.value === selectedValue)) {
      selectEl.value = selectedValue;
    } else if (includeAllOption) {
      selectEl.value = 'all';
    } else {
      selectEl.value = activeTimerTagId;
    }
  };

  const renderTagManager = () => {
    const listEl = document.getElementById('tagManagerList');
    if (!listEl) return;

    listEl.innerHTML = '';
    tags.forEach((tag) => {
      const item = document.createElement('li');
      item.className = 'tag-manager-item';

      const tagIdentity = document.createElement('div');
      tagIdentity.className = 'tag-manager-identity';

      const swatch = document.createElement('span');
      swatch.className = 'tag-swatch';
      swatch.style.setProperty('--tag-color', getColorOption(tag.colorId).hex);
      swatch.setAttribute('aria-hidden', 'true');

      const name = document.createElement('span');
      name.className = 'tag-manager-name';
      name.textContent = tag.name;

      tagIdentity.appendChild(swatch);
      tagIdentity.appendChild(name);

      const controls = document.createElement('div');
      controls.className = 'tag-manager-controls';

      const colorSelect = document.createElement('select');
      colorSelect.className = 'tag-color-select';
      colorSelect.dataset.tagId = tag.id;
      fillColorSelect(colorSelect, tag.colorId);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'tag-delete-btn';
      deleteBtn.dataset.tagId = tag.id;
      deleteBtn.textContent = 'Delete';
      deleteBtn.disabled = Boolean(tag.system);
      deleteBtn.setAttribute('aria-label', `Delete tag ${tag.name}`);

      controls.appendChild(colorSelect);
      controls.appendChild(deleteBtn);

      item.appendChild(tagIdentity);
      item.appendChild(controls);
      listEl.appendChild(item);
    });
  };

  const refreshUI = () => {
    renderTagManager();

    const timerSelect = document.getElementById('timerTagSelect');
    fillTagSelect(timerSelect, { selectedValue: activeTimerTagId });

    const todoTagSelect = document.getElementById('todoTagSelect');
    const currentTodoTag = todoTagSelect?.value || activeTimerTagId;
    fillTagSelect(todoTagSelect, { selectedValue: currentTodoTag });

    const todoFilterSelect = document.getElementById('todoFilterTag');
    const currentFilter = todoFilterSelect?.value || 'all';
    fillTagSelect(todoFilterSelect, {
      includeAllOption: true,
      allLabel: 'Filter by tags',
      selectedValue: currentFilter
    });
  };

  const addTag = async (nameInput, colorIdInput) => {
    const name = normalizeTagName(nameInput);
    if (!name) {
      setFeedback('Enter a tag name.');
      return;
    }

    const duplicate = tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setFeedback('A tag with that name already exists.');
      return;
    }

    if (tags.length >= MAX_TAGS) {
      setFeedback(`You can create up to ${MAX_TAGS} tags.`);
      return;
    }

    tags = [
      ...tags,
      {
        id: createTagId(),
        name,
        colorId: getColorOption(colorIdInput).id,
        system: false
      }
    ];
    await persist();
    refreshUI();
    emitUpdated();
    setFeedback(`Added tag ${name}.`);
  };

  const updateTagColor = async (tagId, nextColorId) => {
    let updated = false;
    tags = tags.map((tag) => {
      if (tag.id !== tagId) return tag;
      const colorId = getColorOption(nextColorId).id;
      if (tag.colorId === colorId) return tag;
      updated = true;
      return { ...tag, colorId };
    });

    if (!updated) return;
    await persist();
    refreshUI();
    emitUpdated();
    setFeedback('Tag color updated.');
  };

  const deleteTag = async (tagId) => {
    const target = tags.find((tag) => tag.id === tagId);
    if (!target || target.system) return;

    if (!confirm(`Delete tag "${target.name}"? Existing items will move to Untagged.`)) {
      return;
    }

    tags = ensureUntaggedTag(tags.filter((tag) => tag.id !== tagId));
    if (activeTimerTagId === tagId) {
      activeTimerTagId = UNTAGGED_ID;
    }

    await persist();
    refreshUI();
    emitUpdated();
    setFeedback(`Deleted tag ${target.name}.`);
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.getElementById('timerTagSelect')?.addEventListener('change', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      activeTimerTagId = resolveTagId(target.value);
      await persist();
      refreshUI();
      emitUpdated();
    });

    document.getElementById('tagCreateForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const nameInput = document.getElementById('newTagName');
      const colorInput = document.getElementById('newTagColor');
      if (!(nameInput instanceof HTMLInputElement) || !(colorInput instanceof HTMLSelectElement)) return;

      await addTag(nameInput.value, colorInput.value);
      nameInput.value = '';
      nameInput.focus();
    });

    document.getElementById('tagManagerList')?.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || !target.classList.contains('tag-color-select')) return;
      const tagId = target.dataset.tagId;
      if (!tagId) return;
      void updateTagColor(tagId, target.value);
    });

    document.getElementById('tagManagerList')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('.tag-delete-btn');
      if (!(button instanceof HTMLButtonElement)) return;
      const tagId = button.dataset.tagId;
      if (!tagId) return;
      void deleteTag(tagId);
    });

    listenersBound = true;
  };

  const load = async () => {
    tags = sanitizeTags(await StorageModule.getItem(TAGS_STORAGE_KEY));
    activeTimerTagId = sanitizeActiveTagId(await StorageModule.getItem(ACTIVE_TAG_STORAGE_KEY), tags);

    fillColorSelect(document.getElementById('newTagColor'));
    bindEvents();
    refreshUI();
    setFeedback('');
    emitUpdated();
  };

  return {
    load,
    getTags: () => tags.map((tag) => ({ ...tag, colorHex: getColorOption(tag.colorId).hex })),
    getColorOptions: () => [...COLOR_OPTIONS],
    getActiveTimerTagId: () => resolveTagId(activeTimerTagId),
    resolveTagId,
    getTagName,
    getTagColor,
    UNTAGGED_ID
  };
})();

// TimerModule - Manages countdown timer state and controls
const TimerModule = (() => {
  let totalSeconds = 999 * 3600;
  let timer = null;
  let paused = true;
  let timeUsedToday = 0;
  let sessionStartedAtMs = null;
  let unsyncedTickCount = 0;

  const emitStateChange = () => {
    document.dispatchEvent(new CustomEvent('timer:statechange', {
      detail: { totalSeconds, paused, timeUsedToday }
    }));
  };

  const saveState = async (syncCloud = true) => {
    await StorageModule.setItem('timerState', {
      totalSeconds,
      paused
    }, { syncCloud });
  };

  const finalizeCurrentSession = async ({ syncCloud = true } = {}) => {
    if (timeUsedToday <= 0 || !sessionStartedAtMs) {
      timeUsedToday = 0;
      sessionStartedAtMs = null;
      unsyncedTickCount = 0;
      return;
    }

    const sessionEndedAtMs = Date.now();
    const activeTagId = typeof TagsModule !== 'undefined'
      ? TagsModule.getActiveTimerTagId()
      : 'tag-untagged';
    await AnalyticsModule.recordSession({
      startTime: new Date(sessionStartedAtMs).toISOString(),
      endTime: new Date(sessionEndedAtMs).toISOString(),
      durationSeconds: timeUsedToday,
      tagId: activeTagId
    }, { syncCloud });

    timeUsedToday = 0;
    sessionStartedAtMs = null;
    unsyncedTickCount = 0;
  };

  const finalizeCurrentSessionLocally = () => {
    if (timeUsedToday <= 0 || !sessionStartedAtMs) {
      timeUsedToday = 0;
      sessionStartedAtMs = null;
      unsyncedTickCount = 0;
      return;
    }

    const sessionEndedAtMs = Date.now();
    const activeTagId = typeof TagsModule !== 'undefined'
      ? TagsModule.getActiveTimerTagId()
      : 'tag-untagged';
    AnalyticsModule.recordSessionLocal({
      startTime: new Date(sessionStartedAtMs).toISOString(),
      endTime: new Date(sessionEndedAtMs).toISOString(),
      durationSeconds: timeUsedToday,
      tagId: activeTagId
    });

    timeUsedToday = 0;
    sessionStartedAtMs = null;
    unsyncedTickCount = 0;
  };

  const handleTimerCompleted = async () => {
    clearInterval(timer);
    timer = null;
    paused = true;

    await finalizeCurrentSession({ syncCloud: true });
    updateDisplay();
    await saveState(true);
  };

  const startTimer = () => {
    if (!paused || totalSeconds <= 0) return;

    paused = false;
    if (!sessionStartedAtMs) {
      sessionStartedAtMs = Date.now();
    }
    updateDisplay();

    timer = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        timeUsedToday++;
        unsyncedTickCount++;
        updateDisplay();

        if (unsyncedTickCount >= 30) {
          unsyncedTickCount = 0;
          saveState(true);
        } else {
          saveState(false);
        }

        if (totalSeconds === 0) {
          void handleTimerCompleted();
        }
      } else {
        void handleTimerCompleted();
      }
    }, 1000);
  };

  const pauseTimer = async (options = {}) => {
    const { syncCloud = true } = options;
    if (paused) return;

    paused = true;
    clearInterval(timer);
    timer = null;

    await finalizeCurrentSession({ syncCloud });
    updateDisplay();
    await saveState(syncCloud);
  };

  const setDurationSeconds = async (seconds, options = {}) => {
    const { syncCloud = true } = options;
    const safeSeconds = Number.parseInt(seconds, 10);
    if (!Number.isFinite(safeSeconds) || safeSeconds < 60 || safeSeconds > MAX_TIMER_SECONDS) {
      return false;
    }

    if (!paused) {
      await pauseTimer({ syncCloud });
    }

    totalSeconds = safeSeconds;
    timeUsedToday = 0;
    sessionStartedAtMs = null;
    unsyncedTickCount = 0;
    paused = true;
    updateDisplay();
    await saveState(syncCloud);
    return true;
  };

  const resetTimer = async () => {
    await setDurationSeconds(MAX_TIMER_SECONDS, { syncCloud: true });
  };

  const setCustomHours = async () => {
    const input = prompt(`Enter number of hours (1 to ${MAX_TIMER_HOURS}):`);
    if (input === null) return;

    const hours = parseInt(input, 10);
    if (!isNaN(hours) && hours >= 1 && hours <= MAX_TIMER_HOURS) {
      await setDurationSeconds(hours * 3600, { syncCloud: true });
    } else {
      alert(`Invalid number! Enter a value between 1 and ${MAX_TIMER_HOURS}.`);
    }
  };

  const updateDisplay = () => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    document.getElementById("timer").innerText =
      `${hrs.toString().padStart(4, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    emitStateChange();
  };

  const loadState = async () => {
    const saved = await StorageModule.getItem('timerState');
    if (saved) {
      totalSeconds = saved.totalSeconds;
      paused = true;
      updateDisplay();
      if (!saved.paused && totalSeconds > 0) startTimer();
    } else {
      updateDisplay();
    }
  };

  const persistOnExit = () => {
    if (paused) return;

    paused = true;
    clearInterval(timer);
    timer = null;
    finalizeCurrentSessionLocally();
    updateDisplay();
    void saveState(false);
  };

  const getTotalSeconds = () => totalSeconds;
  const getTimeUsedToday = () => timeUsedToday;
  const isPaused = () => paused;

  return {
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
    setCustomHours,
    setDurationSeconds,
    updateDisplay,
    loadState,
    saveState,
    persistOnExit,
    getTotalSeconds,
    getTimeUsedToday,
    isPaused
  };
})();


// AnalyticsModule - Tracks daily usage, sessions, and renders scalable visualizations
const AnalyticsModule = (() => {
  const SESSION_LOGS_KEY = 'sessionLogs';
  const DEFAULT_TAG_ID = 'tag-untagged';
  const PAGE_SIZE = 14;
  const CHART_MAX_POINTS = 30;

  let usageChart = null;
  let filterQuery = '';
  let visibleCount = PAGE_SIZE;
  let controlsBound = false;
  let lastRenderedHistory = {};
  let pendingDeletedEntry = null;
  const collapsedMonths = new Set();
  let monthCollapseInitialized = false;

  const emitAnalyticsUpdated = (history) => {
    document.dispatchEvent(new CustomEvent('analytics:updated', {
      detail: { history }
    }));
  };

  const createSessionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `session-${crypto.randomUUID()}`;
    }
    return `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  };

  const formatDateKeyUTC = (date) => date.toISOString().split('T')[0];

  const getDayBoundsUTC = (dateKey) => {
    const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
    const nextDayStart = new Date(dayStart);
    nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);
    return { dayStart, nextDayStart };
  };

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, Number.parseInt(seconds, 10) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(Date.UTC(year, (month || 1) - 1, 1));
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const normalizeHistory = (rawHistory) => {
    const normalized = {};
    if (!rawHistory || typeof rawHistory !== 'object') return normalized;

    Object.entries(rawHistory).forEach(([date, entry]) => {
      if (!entry || typeof entry !== 'object') return;
      const timeSpent = Math.max(0, Number.parseInt(entry.timeSpent, 10) || 0);
      const sessions = Math.max(0, Number.parseInt(entry.sessions, 10) || 0);
      if (timeSpent === 0 && sessions === 0) return;
      normalized[date] = { timeSpent, sessions };
    });

    return normalized;
  };

  const normalizeSessionLogs = (rawLogs) => {
    if (!Array.isArray(rawLogs)) return [];

    return rawLogs
      .filter((log) => log && typeof log === 'object')
      .map((log) => {
        const durationSeconds = Math.max(0, Number.parseInt(log.durationSeconds, 10) || 0);
        const startTime = new Date(log.startTime);
        const endTime = new Date(log.endTime);
        if (durationSeconds <= 0 || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
          return null;
        }

        return {
          id: typeof log.id === 'string' ? log.id : createSessionId(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationSeconds,
          tagId: typeof TagsModule !== 'undefined'
            ? TagsModule.resolveTagId(log.tagId)
            : (typeof log.tagId === 'string' ? log.tagId : DEFAULT_TAG_ID)
        };
      })
      .filter(Boolean)
      .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
  };

  const getHistory = async () => normalizeHistory(await StorageModule.getItem('analytics') || {});
  const getHistoryLocal = () => normalizeHistory(StorageModule.getItemLocalSync('analytics') || {});
  const getSessionLogs = async () => normalizeSessionLogs(await StorageModule.getItem(SESSION_LOGS_KEY) || []);
  const getSessionLogsLocal = () => normalizeSessionLogs(StorageModule.getItemLocalSync(SESSION_LOGS_KEY) || []);

  const setHistory = async (history, syncCloud = true) => {
    await StorageModule.setItem('analytics', normalizeHistory(history), { syncCloud });
  };

  const setSessionLogs = async (logs, syncCloud = true) => {
    await StorageModule.setItem(SESSION_LOGS_KEY, normalizeSessionLogs(logs), { syncCloud });
  };

  const setActionFeedback = (message = '', undoHandler = null) => {
    const feedbackEl = document.getElementById('analyticsActionFeedback');
    if (!feedbackEl) return;

    feedbackEl.innerHTML = '';
    if (!message) return;

    const textNode = document.createElement('span');
    textNode.textContent = message;
    feedbackEl.appendChild(textNode);

    if (typeof undoHandler === 'function') {
      const undoBtn = document.createElement('button');
      undoBtn.type = 'button';
      undoBtn.className = 'feedback-inline-btn';
      undoBtn.textContent = 'Undo';
      undoBtn.addEventListener('click', undoHandler);
      feedbackEl.appendChild(undoBtn);
    }
  };

  const splitSessionByDay = (startIso, endIso, durationSeconds) => {
    const segments = {};
    const safeDuration = Math.max(0, Number.parseInt(durationSeconds, 10) || 0);
    const start = new Date(startIso);
    const end = new Date(endIso);

    if (safeDuration <= 0 || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      const fallbackDate = Number.isNaN(start.getTime()) ? formatDateKeyUTC(new Date()) : formatDateKeyUTC(start);
      segments[fallbackDate] = safeDuration;
      return segments;
    }

    let cursor = new Date(start);
    let remaining = safeDuration;

    while (cursor < end && remaining > 0) {
      const { nextDayStart } = getDayBoundsUTC(formatDateKeyUTC(cursor));
      const segmentEnd = end < nextDayStart ? end : nextDayStart;
      let seconds = Math.floor((segmentEnd.getTime() - cursor.getTime()) / 1000);

      if (seconds <= 0) {
        seconds = remaining;
      }
      if (seconds > remaining) {
        seconds = remaining;
      }

      const dayKey = formatDateKeyUTC(cursor);
      segments[dayKey] = (segments[dayKey] || 0) + seconds;
      remaining -= seconds;
      cursor = new Date(segmentEnd.getTime());
    }

    if (remaining > 0) {
      const finalDayKey = formatDateKeyUTC(end);
      segments[finalDayKey] = (segments[finalDayKey] || 0) + remaining;
    }

    return segments;
  };

  const applySessionToData = (history, logs, sessionPayload) => {
    const nextHistory = normalizeHistory(history);
    const nextLogs = normalizeSessionLogs(logs);

    const durationSeconds = Math.max(0, Number.parseInt(sessionPayload.durationSeconds, 10) || 0);
    if (durationSeconds <= 0) {
      return { nextHistory, nextLogs };
    }

    const startIso = new Date(sessionPayload.startTime).toISOString();
    const endIso = new Date(sessionPayload.endTime).toISOString();
    const sessionId = createSessionId();
    const tagId = typeof TagsModule !== 'undefined'
      ? TagsModule.resolveTagId(sessionPayload.tagId)
      : (typeof sessionPayload.tagId === 'string' ? sessionPayload.tagId : DEFAULT_TAG_ID);

    nextLogs.push({
      id: sessionId,
      startTime: startIso,
      endTime: endIso,
      durationSeconds,
      tagId
    });

    const MAX_SESSION_LOGS = 10000;
    if (nextLogs.length > MAX_SESSION_LOGS) {
      nextLogs.splice(0, nextLogs.length - MAX_SESSION_LOGS);
    }

    const daySegments = splitSessionByDay(startIso, endIso, durationSeconds);
    Object.entries(daySegments).forEach(([dayKey, seconds]) => {
      if (!nextHistory[dayKey]) {
        nextHistory[dayKey] = { timeSpent: 0, sessions: 0 };
      }

      nextHistory[dayKey].timeSpent += seconds;
      nextHistory[dayKey].sessions += 1;
    });

    return { nextHistory, nextLogs };
  };

  const doesSessionTouchDate = (session, dateKey) => {
    const { dayStart, nextDayStart } = getDayBoundsUTC(dateKey);
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return start < nextDayStart && end > dayStart;
  };

  const projectSessionToDate = (session, dateKey) => {
    const { dayStart, nextDayStart } = getDayBoundsUTC(dateKey);
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }

    const segmentStart = start > dayStart ? start : dayStart;
    const segmentEnd = end < nextDayStart ? end : nextDayStart;
    if (segmentEnd <= segmentStart) return null;

    const durationSeconds = Math.max(1, Math.floor((segmentEnd.getTime() - segmentStart.getTime()) / 1000));
    return {
      ...session,
      segmentStart: segmentStart.toISOString(),
      segmentEnd: segmentEnd.toISOString(),
      durationSeconds,
      isClipped: segmentStart.getTime() > start.getTime() || segmentEnd.getTime() < end.getTime()
    };
  };

  const excludeDateFromSessionLogs = (logs, dateKey) => {
    const { dayStart, nextDayStart } = getDayBoundsUTC(dateKey);
    const nextLogs = [];

    logs.forEach((log) => {
      const start = new Date(log.startTime);
      const end = new Date(log.endTime);
      const overlapsDay = start < nextDayStart && end > dayStart;

      if (!overlapsDay) {
        nextLogs.push(log);
        return;
      }

      if (start < dayStart) {
        const beforeDuration = Math.floor((dayStart.getTime() - start.getTime()) / 1000);
        if (beforeDuration > 0) {
          nextLogs.push({
            id: createSessionId(),
            startTime: start.toISOString(),
            endTime: dayStart.toISOString(),
            durationSeconds: beforeDuration,
            tagId: log.tagId || DEFAULT_TAG_ID
          });
        }
      }

      if (end > nextDayStart) {
        const afterDuration = Math.floor((end.getTime() - nextDayStart.getTime()) / 1000);
        if (afterDuration > 0) {
          nextLogs.push({
            id: createSessionId(),
            startTime: nextDayStart.toISOString(),
            endTime: end.toISOString(),
            durationSeconds: afterDuration,
            tagId: log.tagId || DEFAULT_TAG_ID
          });
        }
      }
    });

    return normalizeSessionLogs(nextLogs);
  };

  const getDailyReport = async (dateKey) => {
    const history = await getHistory();
    const logs = await getSessionLogs();
    const entry = history[dateKey] || { timeSpent: 0, sessions: 0 };
    const daySessions = logs
      .filter((log) => doesSessionTouchDate(log, dateKey))
      .map((log) => projectSessionToDate(log, dateKey))
      .filter(Boolean)
      .sort((first, second) => new Date(first.segmentStart).getTime() - new Date(second.segmentStart).getTime());

    const hasDetailedSessions = daySessions.length > 0;
    const totalSeconds = hasDetailedSessions
      ? daySessions.reduce((sum, session) => sum + session.durationSeconds, 0)
      : entry.timeSpent;
    const sessionCount = hasDetailedSessions ? daySessions.length : entry.sessions;

    return {
      dateKey,
      totalSeconds,
      sessionCount,
      sessions: daySessions
    };
  };

  const recordSession = async (sessionPayload, options = {}) => {
    const { syncCloud = true } = options;
    const history = syncCloud ? await getHistory() : getHistoryLocal();
    const logs = syncCloud ? await getSessionLogs() : getSessionLogsLocal();
    const { nextHistory, nextLogs } = applySessionToData(history, logs, sessionPayload);

    await setSessionLogs(nextLogs, syncCloud);
    await setHistory(nextHistory, syncCloud);
    await showAnalytics(nextHistory);
  };

  const recordSessionLocal = (sessionPayload) => {
    const history = getHistoryLocal();
    const logs = getSessionLogsLocal();
    const { nextHistory, nextLogs } = applySessionToData(history, logs, sessionPayload);

    StorageModule.setItem(SESSION_LOGS_KEY, nextLogs, { syncCloud: false });
    StorageModule.setItem('analytics', nextHistory, { syncCloud: false });
    lastRenderedHistory = nextHistory;
    emitAnalyticsUpdated(nextHistory);
  };

  const renderHistoryList = (entries) => {
    const analyticsRoot = document.getElementById('analytics');
    if (!analyticsRoot) return;

    if (entries.length === 0) {
      analyticsRoot.innerHTML = filterQuery
        ? `<p class="empty-state">No days match this filter.</p>`
        : `<p class="empty-state">No usage history yet. Pause the timer to log your first session.</p>`;
      return;
    }

    const visibleEntries = entries.slice(0, visibleCount);
    const monthMap = new Map();

    visibleEntries.forEach(([date, entry]) => {
      const monthKey = date.slice(0, 7);
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey).push([date, entry]);
    });

    let htmlOutput = '';
    monthMap.forEach((monthEntries, monthKey) => {
      const isCollapsed = collapsedMonths.has(monthKey);
      const totalSeconds = monthEntries.reduce((sum, [, item]) => sum + item.timeSpent, 0);
      const dayCount = monthEntries.length;

      const monthItems = monthEntries.map(([date, entry]) => `
        <li class="analytics-item">
          <div class="analytics-date"><strong>${date}</strong></div>
          <div class="analytics-meta">${formatDuration(entry.timeSpent)} • ${entry.sessions} session${entry.sessions > 1 ? 's' : ''}</div>
          <div class="analytics-actions">
            <button class="view-report-btn" data-date="${date}" aria-label="View report for ${date}">Report</button>
            <button class="delete-btn" data-date="${date}" aria-label="Delete history for ${date}">Delete</button>
          </div>
        </li>
      `).join('');

      htmlOutput += `
        <section class="analytics-month">
          <button class="analytics-month-toggle" data-month="${monthKey}" aria-expanded="${String(!isCollapsed)}">
            <span>${formatMonthLabel(monthKey)}</span>
            <span class="analytics-month-meta">${dayCount} day${dayCount > 1 ? 's' : ''} • ${formatDuration(totalSeconds)}</span>
          </button>
          <div class="analytics-list-wrap ${isCollapsed ? 'is-collapsed' : ''}">
            <ul class="analytics-list" aria-label="Usage days for ${formatMonthLabel(monthKey)}">${monthItems}</ul>
          </div>
        </section>
      `;
    });

    analyticsRoot.innerHTML = htmlOutput;

    document.querySelectorAll('.analytics-month-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const month = button.dataset.month;
        if (!month) return;

        if (collapsedMonths.has(month)) {
          collapsedMonths.delete(month);
        } else {
          collapsedMonths.add(month);
        }
        showAnalytics(lastRenderedHistory);
      });
    });

    document.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const date = button.dataset.date;
        if (date) {
          void deleteHistory(date);
        }
      });
    });

    document.querySelectorAll('.view-report-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const date = button.dataset.date;
        if (date && typeof DailyReportModule !== 'undefined') {
          DailyReportModule.open(date);
        }
      });
    });

    const loadMoreButton = document.getElementById('loadMoreAnalyticsBtn');
    if (loadMoreButton) {
      const hasMore = entries.length > visibleCount;
      loadMoreButton.hidden = !hasMore;
      if (hasMore) {
        loadMoreButton.textContent = `Load Older (${entries.length - visibleCount} more)`;
      }
    }

    const chartSourceEntries = visibleEntries.slice(0, CHART_MAX_POINTS);
    const chartEntries = [...chartSourceEntries].sort((first, second) => first[0].localeCompare(second[0]));
    const labels = chartEntries.map(([date]) => date);
    const data = chartEntries.map(([, entry]) => Number((entry.timeSpent / 3600).toFixed(2)));
    updateChart(labels, data);
  };

  const bindControls = () => {
    if (controlsBound) return;

    const filterInput = document.getElementById('analyticsFilterInput');
    const clearFilterButton = document.getElementById('clearAnalyticsFilterBtn');
    const loadMoreButton = document.getElementById('loadMoreAnalyticsBtn');

    filterInput?.addEventListener('input', (event) => {
      filterQuery = event.target.value.trim().toLowerCase();
      visibleCount = PAGE_SIZE;
      void showAnalytics(lastRenderedHistory);
    });

    clearFilterButton?.addEventListener('click', () => {
      filterQuery = '';
      visibleCount = PAGE_SIZE;
      if (filterInput) {
        filterInput.value = '';
      }
      void showAnalytics(lastRenderedHistory);
    });

    loadMoreButton?.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      void showAnalytics(lastRenderedHistory);
    });

    controlsBound = true;
  };

  const initializeMonthCollapse = (entries) => {
    if (monthCollapseInitialized || entries.length === 0 || filterQuery) return;

    const monthKeys = [...new Set(entries.map(([date]) => date.slice(0, 7)))];
    if (monthKeys.length > 1) {
      monthKeys.slice(1).forEach((monthKey) => collapsedMonths.add(monthKey));
    }

    monthCollapseInitialized = true;
  };

  const showAnalytics = async (historyOverride = null) => {
    bindControls();

    const history = historyOverride
      ? normalizeHistory(historyOverride)
      : await getHistory();
    lastRenderedHistory = history;

    const entries = Object.entries(history).sort((first, second) => second[0].localeCompare(first[0]));
    initializeMonthCollapse(entries);
    const filteredEntries = entries.filter(([date]) => {
      if (!filterQuery) return true;
      return date.toLowerCase().includes(filterQuery);
    });

    renderHistoryList(filteredEntries);
    emitAnalyticsUpdated(history);
  };

  const undoDeletedHistory = async () => {
    if (!pendingDeletedEntry) return;

    const history = await getHistory();
    history[pendingDeletedEntry.date] = pendingDeletedEntry.entry;
    await setSessionLogs(pendingDeletedEntry.previousLogs || [], true);
    await setHistory(history, true);

    clearTimeout(pendingDeletedEntry.timeoutId);
    pendingDeletedEntry = null;
    setActionFeedback('Deletion undone.');
    await showAnalytics(history);
  };

  const deleteHistory = async (date) => {
    const [history, logs] = await Promise.all([getHistory(), getSessionLogs()]);
    if (!history[date]) return;

    if (!confirm(`Delete history for ${date}?`)) {
      return;
    }

    const deletedEntry = history[date];
    const nextLogs = excludeDateFromSessionLogs(logs, date);
    delete history[date];
    await setSessionLogs(nextLogs, true);
    await setHistory(history, true);

    if (pendingDeletedEntry?.timeoutId) {
      clearTimeout(pendingDeletedEntry.timeoutId);
    }

    pendingDeletedEntry = {
      date,
      entry: deletedEntry,
      previousLogs: logs,
      timeoutId: setTimeout(() => {
        pendingDeletedEntry = null;
        setActionFeedback('');
      }, 10000)
    };

    setActionFeedback(`Deleted ${date}.`, () => {
      void undoDeletedHistory();
    });

    if (typeof DailyReportModule !== 'undefined' && DailyReportModule.isOpen()) {
      DailyReportModule.close();
    }

    await showAnalytics(history);
  };

  const updateChart = (labels, data) => {
    if (usageChart) usageChart.destroy();
    const ctx = document.getElementById("usageChart").getContext("2d");
    const styles = getComputedStyle(document.body);
    const textColor = styles.getPropertyValue('--text').trim();
    const gridColor = styles.getPropertyValue('--grid').trim();
    const chartFill = styles.getPropertyValue('--chart-fill').trim();
    const bgColor = styles.getPropertyValue('--bg').trim();

    usageChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Time Used (Hours)',
          data,
          backgroundColor: chartFill,
          borderColor: textColor,
          borderWidth: 1,
          borderSkipped: false,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event, elements) => {
          if (!elements.length) return;
          const selectedDate = labels[elements[0].index];
          if (selectedDate && typeof DailyReportModule !== 'undefined') {
            DailyReportModule.open(selectedDate);
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: textColor,
            titleColor: bgColor,
            bodyColor: bgColor
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor
            },
            grid: {
              color: gridColor
            }
          },
          x: {
            ticks: {
              color: textColor
            },
            grid: {
              color: gridColor
            }
          }
        }
      }
    });
  };

  return {
    recordSession,
    recordSessionLocal,
    showAnalytics,
    deleteHistory,
    updateChart,
    getHistory,
    getSessionLogs,
    getDailyReport
  };
})();


// ThemeModule - Manages light/dark theme toggling
const ThemeModule = (() => {
  const updateThemeToggleLabel = () => {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const isDark = document.body.classList.contains('dark');
    themeToggle.textContent = isDark ? 'Light Theme' : 'Dark Theme';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute(
      'aria-label',
      isDark ? 'Switch to light theme' : 'Switch to dark theme'
    );
  };

  const loadTheme = async () => {
    const theme = await StorageModule.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }

    updateThemeToggleLabel();
  };

  const toggleTheme = async () => {
    document.body.classList.toggle('dark');
    updateThemeToggleLabel();
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    await StorageModule.setItem('theme', theme);
    await AnalyticsModule.showAnalytics();
  };

  const getCurrentTheme = () => {
    return document.body.classList.contains('dark') ? 'dark' : 'light';
  };

  return {
    load: loadTheme,
    toggle: toggleTheme,
    getCurrentTheme
  };
})();

// PresetModule - Quick and custom timer presets
const PresetModule = (() => {
  const STORAGE_KEY = 'customPresets';
  const MAX_CUSTOM_PRESETS = 6;
  const MAX_LABEL_LENGTH = 18;
  const DEFAULT_PRESETS = [
    { id: 'default-25', label: '25m', minutes: 25, isDefault: true },
    { id: 'default-50', label: '50m', minutes: 50, isDefault: true },
    { id: 'default-90', label: '90m', minutes: 90, isDefault: true },
    { id: 'default-120', label: '2h', minutes: 120, isDefault: true }
  ];

  let customPresets = [];
  let eventsBound = false;

  const formatDuration = (minutes) => {
    if (minutes % 60 === 0) {
      return `${minutes / 60}h`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) {
      return `${mins}m`;
    }

    return `${hours}h ${mins}m`;
  };

  const createPresetId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `preset-${crypto.randomUUID()}`;
    }
    return `preset-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  };

  const normalizeLabel = (label, minutes) => {
    const cleaned = typeof label === 'string'
      ? label.trim().slice(0, MAX_LABEL_LENGTH)
      : '';
    return cleaned || formatDuration(minutes);
  };

  const sanitizePresets = (rawPresets) => {
    if (!Array.isArray(rawPresets)) {
      return [];
    }

    const seenIds = new Set();
    return rawPresets
      .filter((preset) => preset && Number.isInteger(preset.minutes))
      .map((preset) => {
        const minutes = preset.minutes;
        if (minutes < 1 || minutes > MAX_PRESET_MINUTES) {
          return null;
        }

        let id = typeof preset.id === 'string' ? preset.id.trim() : '';
        if (!id || seenIds.has(id)) {
          id = createPresetId();
        }
        seenIds.add(id);

        return {
          id,
          label: normalizeLabel(preset.label, minutes),
          minutes
        };
      })
      .filter(Boolean)
      .slice(0, MAX_CUSTOM_PRESETS);
  };

  const getAllPresets = () => [
    ...DEFAULT_PRESETS,
    ...customPresets.map((preset) => ({ ...preset, isDefault: false }))
  ];

  const setFeedback = (message = '') => {
    const feedbackEl = document.getElementById('presetFeedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
    }
  };

  const updatePresetCount = () => {
    const countEl = document.getElementById('presetCount');
    if (countEl) {
      countEl.textContent = `${customPresets.length}/${MAX_CUSTOM_PRESETS} custom`;
    }

    const saveBtn = document.getElementById('savePresetBtn');
    if (saveBtn) {
      saveBtn.disabled = customPresets.length >= MAX_CUSTOM_PRESETS;
    }
  };

  const persist = async () => {
    await StorageModule.setItem(STORAGE_KEY, customPresets);
  };

  const highlightActivePreset = () => {
    const currentSeconds = TimerModule.getTotalSeconds();
    const isExactMinute = currentSeconds % 60 === 0;
    const currentMinutes = isExactMinute ? currentSeconds / 60 : null;

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      const presetMinutes = Number.parseInt(btn.dataset.minutes, 10);
      btn.classList.toggle('is-current', isExactMinute && presetMinutes === currentMinutes);
    });
  };

  const applyPreset = async (preset) => {
    const didSet = await TimerModule.setDurationSeconds(preset.minutes * 60);
    if (!didSet) {
      setFeedback('Could not apply that preset.');
      return;
    }

    setFeedback(`Set timer to ${preset.label}.`);
    highlightActivePreset();
  };

  const deletePreset = async (id) => {
    const target = customPresets.find((preset) => preset.id === id);
    customPresets = customPresets.filter((preset) => preset.id !== id);
    await persist();
    renderPresets();

    if (target) {
      setFeedback(`Removed preset ${target.label}.`);
    }
  };

  const renderPresets = () => {
    const container = document.getElementById('presetButtons');
    if (!container) return;

    container.innerHTML = '';
    const presets = getAllPresets();

    presets.forEach((preset) => {
      const item = document.createElement('div');
      item.className = 'preset-item';

      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'preset-btn';
      applyBtn.dataset.minutes = String(preset.minutes);
      applyBtn.dataset.presetId = preset.id;
      applyBtn.textContent = preset.label;
      applyBtn.setAttribute('aria-label', `Set timer to ${preset.label}`);
      applyBtn.addEventListener('click', async () => {
        await applyPreset(preset);
      });

      item.appendChild(applyBtn);

      if (!preset.isDefault) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'preset-remove';
        removeBtn.textContent = 'Remove';
        removeBtn.setAttribute('aria-label', `Delete preset ${preset.label}`);
        removeBtn.addEventListener('click', async () => {
          await deletePreset(preset.id);
        });
        item.appendChild(removeBtn);
      }

      container.appendChild(item);
    });

    updatePresetCount();
    highlightActivePreset();
  };

  const handlePresetSubmit = async (event) => {
    event.preventDefault();

    const labelInput = document.getElementById('presetLabel');
    const minutesInput = document.getElementById('presetMinutes');
    if (!labelInput || !minutesInput) return;

    const minutes = Number.parseInt(minutesInput.value, 10);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_PRESET_MINUTES) {
      setFeedback(`Enter minutes between 1 and ${MAX_PRESET_MINUTES}.`);
      minutesInput.focus();
      return;
    }

    if (customPresets.length >= MAX_CUSTOM_PRESETS) {
      setFeedback(`You can save up to ${MAX_CUSTOM_PRESETS} custom presets.`);
      return;
    }

    const label = normalizeLabel(labelInput.value, minutes);
    const duplicate = customPresets.some(
      (preset) =>
        preset.minutes === minutes &&
        preset.label.toLowerCase() === label.toLowerCase()
    );
    if (duplicate) {
      setFeedback('That preset already exists.');
      return;
    }

    customPresets.push({
      id: createPresetId(),
      label,
      minutes
    });

    await persist();
    renderPresets();
    labelInput.value = '';
    minutesInput.value = '';
    setFeedback(`Saved preset ${label}.`);
  };

  const bindEvents = () => {
    if (eventsBound) return;

    const presetForm = document.getElementById('presetForm');
    if (presetForm) {
      presetForm.addEventListener('submit', handlePresetSubmit);
    }

    eventsBound = true;
  };

  const loadPresets = async () => {
    const savedPresets = await StorageModule.getItem(STORAGE_KEY);
    customPresets = sanitizePresets(savedPresets);
    bindEvents();
    renderPresets();
    setFeedback('');
  };

  return {
    load: loadPresets,
    highlightActivePreset
  };
})();

// SettingsPanelModule - Controls settings drawer visibility
const SettingsPanelModule = (() => {
  let open = false;

  const setOpen = (nextOpen) => {
    const panel = document.getElementById('settingsPanel');
    const backdrop = document.getElementById('settingsBackdrop');
    const toggle = document.getElementById('settingsToggle');
    const closeBtn = document.getElementById('settingsCloseBtn');
    if (!panel || !backdrop || !toggle) return;

    open = nextOpen;
    panel.hidden = !nextOpen;
    backdrop.hidden = !nextOpen;
    toggle.setAttribute('aria-expanded', String(nextOpen));
    toggle.setAttribute('aria-label', nextOpen ? 'Close settings' : 'Open settings');
    document.body.style.overflow = nextOpen ? 'hidden' : '';

    if (nextOpen) {
      closeBtn?.focus();
    } else {
      toggle.focus();
    }
  };

  const closePanel = () => setOpen(false);
  const openPanel = () => setOpen(true);
  const togglePanel = () => setOpen(!open);

  const init = () => {
    const toggle = document.getElementById('settingsToggle');
    const closeBtn = document.getElementById('settingsCloseBtn');
    const backdrop = document.getElementById('settingsBackdrop');
    if (!toggle || !closeBtn || !backdrop) return;

    toggle.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && open) {
        closePanel();
      }
    });
  };

  return {
    init,
    close: closePanel,
    isOpen: () => open
  };
})();

// ResetConfirmModule - Safety confirmation before destructive reset
const ResetConfirmModule = (() => {
  const REQUIRED_TEXT = 'reset';
  let open = false;
  let listenersBound = false;
  let pendingResolver = null;

  const normalizeInput = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

  const getElements = () => ({
    modal: document.getElementById('resetConfirmModal'),
    backdrop: document.getElementById('resetConfirmBackdrop'),
    form: document.getElementById('resetConfirmForm'),
    input: document.getElementById('resetConfirmInput'),
    feedback: document.getElementById('resetConfirmFeedback'),
    submitBtn: document.getElementById('resetConfirmSubmitBtn'),
    cancelBtn: document.getElementById('resetConfirmCancelBtn')
  });

  const setFeedback = (message = '') => {
    const { feedback } = getElements();
    if (feedback) {
      feedback.textContent = message;
    }
  };

  const updateSubmitState = () => {
    const { input, submitBtn } = getElements();
    if (!input || !submitBtn) return;
    submitBtn.disabled = normalizeInput(input.value) !== REQUIRED_TEXT;
  };

  const setOpen = (nextOpen) => {
    const { modal, backdrop, input } = getElements();
    if (!modal || !backdrop || !input) return;

    open = nextOpen;
    modal.hidden = !nextOpen;
    backdrop.hidden = !nextOpen;

    if (nextOpen) {
      input.value = '';
      setFeedback('');
      updateSubmitState();
      input.focus();
    } else {
      document.getElementById('resetBtn')?.focus();
    }
  };

  const resolveAndClose = (confirmed) => {
    if (!open) return;
    setOpen(false);

    if (pendingResolver) {
      pendingResolver(confirmed);
      pendingResolver = null;
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const { input } = getElements();
    if (!input) return;

    if (normalizeInput(input.value) !== REQUIRED_TEXT) {
      setFeedback('Type reset exactly to continue.');
      updateSubmitState();
      input.focus();
      return;
    }

    setFeedback('');
    resolveAndClose(true);
  };

  const cancel = () => {
    resolveAndClose(false);
  };

  const bindEvents = () => {
    if (listenersBound) return;

    const {
      form,
      input,
      backdrop,
      cancelBtn
    } = getElements();

    form?.addEventListener('submit', submit);
    input?.addEventListener('input', () => {
      updateSubmitState();
      setFeedback('');
    });
    backdrop?.addEventListener('click', cancel);
    cancelBtn?.addEventListener('click', cancel);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && open) {
        cancel();
      }
    });

    listenersBound = true;
  };

  const init = () => {
    bindEvents();
  };

  const requestConfirmation = () => {
    if (open) return Promise.resolve(false);

    return new Promise((resolve) => {
      pendingResolver = resolve;
      setOpen(true);
    });
  };

  return {
    init,
    requestConfirmation,
    isOpen: () => open
  };
})();

async function requestAndResetTimer() {
  const confirmed = await ResetConfirmModule.requestConfirmation();
  if (!confirmed) return;

  await TimerModule.reset();
  syncTimerUIState();
}

// ShortcutModule - Keyboard shortcuts and configuration
const ShortcutModule = (() => {
  const STORAGE_KEY = 'shortcutConfig';
  const ACTIONS = ['toggle', 'reset', 'setHours'];
  const DEFAULT_SHORTCUTS = {
    toggle: 'SPACE',
    reset: 'R',
    setHours: 'H'
  };
  const AVAILABLE_SHORTCUTS = [
    'SPACE',
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    ...'0123456789'.split('')
  ];

  let shortcutConfig = { ...DEFAULT_SHORTCUTS };
  let listenersBound = false;

  const isValidShortcut = (key) => AVAILABLE_SHORTCUTS.includes(key);

  const normalizeShortcutValue = (value) => {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim().toUpperCase();
    if (trimmed === 'SPACE' || trimmed === 'SPACEBAR') return 'SPACE';
    if (trimmed.length === 1 && /^[A-Z0-9]$/.test(trimmed)) return trimmed;
    return null;
  };

  const sanitizeShortcutConfig = (rawConfig) => {
    const config = {};
    const used = new Set();

    ACTIONS.forEach((action) => {
      let value = normalizeShortcutValue(rawConfig?.[action]) || DEFAULT_SHORTCUTS[action];
      if (!isValidShortcut(value) || used.has(value)) {
        value = DEFAULT_SHORTCUTS[action];
      }
      if (used.has(value)) {
        value = AVAILABLE_SHORTCUTS.find((option) => !used.has(option)) || DEFAULT_SHORTCUTS[action];
      }

      used.add(value);
      config[action] = value;
    });

    return config;
  };

  const formatShortcut = (key) => (key === 'SPACE' ? 'Space' : key);
  const formatShortcutForAria = (key) => (key === 'SPACE' ? 'Space' : key.toUpperCase());

  const setFeedback = (message = '') => {
    const feedback = document.getElementById('shortcutFeedback');
    if (feedback) {
      feedback.textContent = message;
    }
  };

  const populateShortcutSelects = () => {
    const selectMap = {
      toggle: document.getElementById('shortcutToggle'),
      reset: document.getElementById('shortcutReset'),
      setHours: document.getElementById('shortcutSetHours')
    };

    Object.entries(selectMap).forEach(([action, select]) => {
      if (!select) return;

      select.innerHTML = '';
      AVAILABLE_SHORTCUTS.forEach((shortcutKey) => {
        const option = document.createElement('option');
        option.value = shortcutKey;
        option.textContent = formatShortcut(shortcutKey);
        select.appendChild(option);
      });
      select.value = shortcutConfig[action];
    });
  };

  const updateShortcutHints = () => {
    document.querySelectorAll('.shortcut-hint').forEach((hintEl) => {
      const action = hintEl.dataset.shortcutFor;
      const key = shortcutConfig[action];
      hintEl.textContent = key ? formatShortcut(key) : '';
    });

    const buttonMap = [
      ['startBtn', 'toggle'],
      ['pauseBtn', 'toggle'],
      ['resetBtn', 'reset'],
      ['setHoursBtn', 'setHours']
    ];

    buttonMap.forEach(([id, action]) => {
      const button = document.getElementById(id);
      const shortcutKey = shortcutConfig[action];
      if (button && shortcutKey) {
        button.setAttribute('aria-keyshortcuts', formatShortcutForAria(shortcutKey));
      }
    });
  };

  const persistShortcutConfig = async () => {
    await StorageModule.setItem(STORAGE_KEY, shortcutConfig);
  };

  const saveShortcutForm = async (event) => {
    event.preventDefault();

    const selectedConfig = {
      toggle: document.getElementById('shortcutToggle')?.value,
      reset: document.getElementById('shortcutReset')?.value,
      setHours: document.getElementById('shortcutSetHours')?.value
    };
    const selectedValues = Object.values(selectedConfig);
    if (new Set(selectedValues).size !== selectedValues.length) {
      setFeedback('Each action needs a unique shortcut.');
      return;
    }

    const nextConfig = sanitizeShortcutConfig(selectedConfig);

    shortcutConfig = nextConfig;
    populateShortcutSelects();
    updateShortcutHints();
    await persistShortcutConfig();
    setFeedback('Shortcuts saved.');
  };

  const resetShortcuts = async () => {
    shortcutConfig = { ...DEFAULT_SHORTCUTS };
    populateShortcutSelects();
    updateShortcutHints();
    await persistShortcutConfig();
    setFeedback('Shortcut defaults restored.');
  };

  const isTypingTarget = (target) => {
    if (!(target instanceof HTMLElement)) return false;
    return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName) || target.isContentEditable;
  };

  const normalizeEventShortcut = (event) => {
    if (event.code === 'Space' || event.key === ' ') {
      return 'SPACE';
    }

    if (typeof event.key === 'string' && event.key.length === 1) {
      const upper = event.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(upper)) {
        return upper;
      }
    }

    return null;
  };

  const runShortcutAction = async (action) => {
    if (action === 'toggle') {
      if (TimerModule.isPaused()) {
        TimerModule.start();
      } else {
        await TimerModule.pause();
      }
      syncTimerUIState();
      return;
    }

    if (action === 'reset') {
      await requestAndResetTimer();
      return;
    }

    if (action === 'setHours') {
      await TimerModule.setCustomHours();
      syncTimerUIState();
    }
  };

  const handleGlobalKeydown = async (event) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (SettingsPanelModule.isOpen()) return;
    if (ResetConfirmModule.isOpen()) return;
    if (isTypingTarget(event.target)) return;

    const shortcutKey = normalizeEventShortcut(event);
    if (!shortcutKey) return;

    const action = ACTIONS.find((name) => shortcutConfig[name] === shortcutKey);
    if (!action) return;

    event.preventDefault();
    await runShortcutAction(action);
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.getElementById('shortcutForm')?.addEventListener('submit', saveShortcutForm);
    document.getElementById('resetShortcutsBtn')?.addEventListener('click', resetShortcuts);
    document.addEventListener('keydown', handleGlobalKeydown);
    listenersBound = true;
  };

  const load = async () => {
    const savedConfig = await StorageModule.getItem(STORAGE_KEY);
    shortcutConfig = sanitizeShortcutConfig(savedConfig || DEFAULT_SHORTCUTS);
    bindEvents();
    populateShortcutSelects();
    updateShortcutHints();
    setFeedback('');
  };

  return {
    load,
    updateHints: updateShortcutHints
  };
})();

// GoalsModule - Weekly streak and goal tracking
const GoalsModule = (() => {
  const STORAGE_KEY = 'weeklyGoalHours';
  const DEFAULT_WEEKLY_GOAL_HOURS = 10;
  let weeklyGoalHours = DEFAULT_WEEKLY_GOAL_HOURS;
  let listenersBound = false;

  const formatDateKey = (date) => date.toISOString().split('T')[0];

  const parseDateKey = (dateKey) => {
    const parsed = new Date(`${dateKey}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const sanitizeGoalValue = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) return DEFAULT_WEEKLY_GOAL_HOURS;
    return Math.min(200, Math.max(1, parsed));
  };

  const getWeekBounds = (referenceDate = new Date()) => {
    const today = new Date(referenceDate);
    today.setUTCHours(0, 0, 0, 0);

    const day = today.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() + diffToMonday);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end, today };
  };

  const formatHoursCompact = (seconds) => `${(seconds / 3600).toFixed(1)}h`;

  const setFeedback = (message = '') => {
    const feedback = document.getElementById('goalFeedback');
    if (feedback) {
      feedback.textContent = message;
    }
  };

  const renderGoalMetrics = ({ activeDays, streak, weekSeconds }) => {
    const goalSeconds = weeklyGoalHours * 3600;
    const percent = goalSeconds > 0 ? Math.min(100, Math.round((weekSeconds / goalSeconds) * 100)) : 0;

    const activeDaysEl = document.getElementById('weekActiveDays');
    const streakEl = document.getElementById('currentStreak');
    const progressTextEl = document.getElementById('goalProgressText');
    const percentTextEl = document.getElementById('goalPercentText');
    const progressBar = document.getElementById('goalProgressBar');
    const goalInput = document.getElementById('weeklyGoalHours');

    if (activeDaysEl) activeDaysEl.textContent = `${activeDays}/7`;
    if (streakEl) streakEl.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    if (progressTextEl) progressTextEl.textContent = `${formatHoursCompact(weekSeconds)} / ${weeklyGoalHours}h`;
    if (percentTextEl) percentTextEl.textContent = `${percent}%`;
    if (progressBar) progressBar.value = percent;
    if (goalInput) goalInput.value = String(weeklyGoalHours);
  };

  const calculateMetrics = (history) => {
    const normalizedEntries = Object.entries(history || {}).filter(([, entry]) => (entry?.timeSpent || 0) > 0);
    const activeDateKeys = normalizedEntries.map(([date]) => date);
    const activeDateSet = new Set(activeDateKeys);
    const { start, end, today } = getWeekBounds();

    let activeDays = 0;
    let weekSeconds = 0;

    normalizedEntries.forEach(([dateKey, entry]) => {
      const date = parseDateKey(dateKey);
      if (!date) return;

      if (date >= start && date <= end) {
        activeDays += 1;
        weekSeconds += entry.timeSpent || 0;
      }
    });

    let streak = 0;
    const cursor = new Date(today);
    while (activeDateSet.has(formatDateKey(cursor))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return { activeDays, streak, weekSeconds };
  };

  const refresh = async (historyOverride = null) => {
    const history = historyOverride || await AnalyticsModule.getHistory();
    const metrics = calculateMetrics(history);
    renderGoalMetrics(metrics);
  };

  const saveWeeklyGoal = async (event) => {
    event.preventDefault();
    const goalInput = document.getElementById('weeklyGoalHours');
    if (!goalInput) return;

    weeklyGoalHours = sanitizeGoalValue(goalInput.value);
    await StorageModule.setItem(STORAGE_KEY, weeklyGoalHours);
    await refresh();
    setFeedback('Weekly goal saved.');
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.getElementById('weeklyGoalForm')?.addEventListener('submit', saveWeeklyGoal);
    document.addEventListener('analytics:updated', (event) => {
      refresh(event.detail?.history || {});
    });
    listenersBound = true;
  };

  const load = async () => {
    weeklyGoalHours = sanitizeGoalValue(await StorageModule.getItem(STORAGE_KEY));
    bindEvents();
    await refresh();
    setFeedback('');
  };

  return {
    load,
    refresh
  };
})();

// BackupModule - Export/import analytics history as JSON or CSV
const BackupModule = (() => {
  const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const SESSION_LOGS_KEY = 'sessionLogs';
  const DEFAULT_TAG_ID = 'tag-untagged';
  const MAX_SESSION_LOGS = 10000;
  let listenersBound = false;

  const setFeedback = (message = '') => {
    const feedback = document.getElementById('backupFeedback');
    if (feedback) {
      feedback.textContent = message;
    }
  };

  const parseNonNegativeInt = (value, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, parsed);
  };

  const parseNonNegativeFloat = (value, fallback = 0) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, parsed);
  };

  const isValidDateKey = (dateKey) => {
    if (typeof dateKey !== 'string') return false;
    const normalized = dateKey.trim();
    if (!DATE_KEY_REGEX.test(normalized)) return false;
    const parsed = new Date(`${normalized}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime());
  };

  const addHistoryEntry = (history, dateKey, timeSpent, sessions) => {
    const normalizedDate = typeof dateKey === 'string' ? dateKey.trim() : '';
    if (!isValidDateKey(normalizedDate)) return;

    const safeTime = Math.max(0, Math.floor(timeSpent));
    const safeSessions = Math.max(0, Math.floor(sessions));
    if (safeTime === 0 && safeSessions === 0) return;

    const sessionCount = safeSessions > 0 ? safeSessions : (safeTime > 0 ? 1 : 0);
    const existing = history[normalizedDate] || { timeSpent: 0, sessions: 0 };
    history[normalizedDate] = {
      timeSpent: existing.timeSpent + safeTime,
      sessions: existing.sessions + sessionCount
    };
  };

  const normalizeHistory = (rawHistory) => {
    const normalized = {};

    if (!rawHistory) return normalized;

    if (Array.isArray(rawHistory)) {
      rawHistory.forEach((row) => {
        if (!row || typeof row !== 'object') return;
        const dateKey = row.date || row.day || row.Date || row.DAY;
        const seconds = row.timeSpent
          ?? row.time_spent
          ?? row.time_spent_seconds
          ?? row.seconds
          ?? row.duration_seconds
          ?? 0;
        const sessions = row.sessions
          ?? row.session_count
          ?? row.sessionCount
          ?? 0;
        addHistoryEntry(
          normalized,
          dateKey,
          parseNonNegativeInt(seconds),
          parseNonNegativeInt(sessions)
        );
      });
      return normalized;
    }

    if (typeof rawHistory === 'object') {
      Object.entries(rawHistory).forEach(([dateKey, entry]) => {
        if (!entry || typeof entry !== 'object') return;
        const seconds = entry.timeSpent
          ?? entry.time_spent
          ?? entry.time_spent_seconds
          ?? entry.seconds
          ?? entry.duration_seconds
          ?? 0;
        const sessions = entry.sessions
          ?? entry.session_count
          ?? entry.sessionCount
          ?? 0;
        addHistoryEntry(
          normalized,
          dateKey,
          parseNonNegativeInt(seconds),
          parseNonNegativeInt(sessions)
        );
      });
    }

    return normalized;
  };

  const createSessionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `session-${crypto.randomUUID()}`;
    }
    return `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  };

  const normalizeSessionLogs = (rawLogs) => {
    if (!Array.isArray(rawLogs)) return [];

    return rawLogs
      .filter((log) => log && typeof log === 'object')
      .map((log) => {
        const startTime = new Date(log.startTime);
        const endTime = new Date(log.endTime);
        const durationSeconds = parseNonNegativeInt(log.durationSeconds, 0);

        if (
          Number.isNaN(startTime.getTime())
          || Number.isNaN(endTime.getTime())
          || durationSeconds <= 0
          || endTime <= startTime
        ) {
          return null;
        }

        return {
          id: typeof log.id === 'string' ? log.id : createSessionId(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationSeconds,
          tagId: typeof TagsModule !== 'undefined'
            ? TagsModule.resolveTagId(log.tagId)
            : (typeof log.tagId === 'string' ? log.tagId : DEFAULT_TAG_ID)
        };
      })
      .filter(Boolean)
      .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
  };

  const formatDateKeyUTC = (date) => date.toISOString().split('T')[0];

  const splitSessionByDay = (startIso, endIso, durationSeconds) => {
    const segments = {};
    const safeDuration = Math.max(0, Number.parseInt(durationSeconds, 10) || 0);
    const start = new Date(startIso);
    const end = new Date(endIso);

    if (safeDuration <= 0 || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return segments;
    }

    let cursor = new Date(start);
    let remaining = safeDuration;

    while (cursor < end && remaining > 0) {
      const nextDayStart = new Date(cursor);
      nextDayStart.setUTCHours(0, 0, 0, 0);
      nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);

      const segmentEnd = end < nextDayStart ? end : nextDayStart;
      let seconds = Math.floor((segmentEnd.getTime() - cursor.getTime()) / 1000);
      if (seconds <= 0) {
        seconds = remaining;
      }
      if (seconds > remaining) {
        seconds = remaining;
      }

      const dayKey = formatDateKeyUTC(cursor);
      segments[dayKey] = (segments[dayKey] || 0) + seconds;
      remaining -= seconds;
      cursor = new Date(segmentEnd.getTime());
    }

    if (remaining > 0) {
      const finalDayKey = formatDateKeyUTC(end);
      segments[finalDayKey] = (segments[finalDayKey] || 0) + remaining;
    }

    return segments;
  };

  const deriveHistoryFromSessionLogs = (sessionLogs) => {
    const history = {};
    normalizeSessionLogs(sessionLogs).forEach((log) => {
      const daySegments = splitSessionByDay(log.startTime, log.endTime, log.durationSeconds);
      Object.entries(daySegments).forEach(([dateKey, seconds]) => {
        if (!history[dateKey]) {
          history[dateKey] = { timeSpent: 0, sessions: 0 };
        }

        history[dateKey].timeSpent += seconds;
        history[dateKey].sessions += 1;
      });
    });

    return history;
  };

  const parseCsvLine = (line) => {
    const output = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        output.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    output.push(current.trim());
    return output;
  };

  const parseCsvHistory = (csvText) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('CSV should include a header and at least one row.');
    }

    const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase().replace(/\s+/g, '_'));
    const dateIndex = header.findIndex((name) => ['date', 'day'].includes(name));
    const timeSecondsIndex = header.findIndex((name) => [
      'time_spent_seconds',
      'time_spent',
      'timespent',
      'seconds',
      'duration_seconds'
    ].includes(name));
    const timeHoursIndex = header.findIndex((name) => ['time_hours', 'hours'].includes(name));
    const sessionsIndex = header.findIndex((name) => [
      'sessions',
      'session_count',
      'sessioncount'
    ].includes(name));

    if (dateIndex === -1) {
      throw new Error('CSV must include a date column.');
    }

    const normalized = {};
    for (let i = 1; i < lines.length; i += 1) {
      const row = parseCsvLine(lines[i]);
      const dateKey = row[dateIndex] || '';
      const secondsValue = timeSecondsIndex !== -1
        ? parseNonNegativeInt(row[timeSecondsIndex], 0)
        : Math.round(parseNonNegativeFloat(row[timeHoursIndex], 0) * 3600);
      const sessionsValue = sessionsIndex !== -1
        ? parseNonNegativeInt(row[sessionsIndex], 0)
        : 0;

      addHistoryEntry(normalized, dateKey, secondsValue, sessionsValue);
    }

    return normalized;
  };

  const parseJsonBackup = (jsonText) => {
    const parsed = JSON.parse(jsonText);
    const historyCandidate = parsed?.history ?? parsed?.analytics ?? parsed;
    const sessionCandidate = parsed?.sessionLogs ?? parsed?.sessions ?? [];
    const parsedHistory = normalizeHistory(historyCandidate);
    const parsedSessionLogs = normalizeSessionLogs(sessionCandidate);
    const history = Object.keys(parsedHistory).length > 0
      ? parsedHistory
      : deriveHistoryFromSessionLogs(parsedSessionLogs);

    return {
      history,
      sessionLogs: parsedSessionLogs
    };
  };

  const mergeHistory = (existingHistory, importedHistory) => {
    const merged = normalizeHistory(existingHistory);
    Object.entries(importedHistory).forEach(([dateKey, entry]) => {
      const current = merged[dateKey];
      if (!current) {
        merged[dateKey] = {
          timeSpent: entry.timeSpent,
          sessions: entry.sessions
        };
        return;
      }

      merged[dateKey] = {
        timeSpent: Math.max(current.timeSpent, entry.timeSpent),
        sessions: Math.max(current.sessions, entry.sessions)
      };
    });
    return merged;
  };

  const mergeSessionLogs = (existingSessionLogs, importedSessionLogs) => {
    const merged = normalizeSessionLogs(existingSessionLogs);
    const imported = normalizeSessionLogs(importedSessionLogs);
    const signatureSet = new Set(merged.map((log) => `${log.startTime}|${log.endTime}|${log.durationSeconds}|${log.tagId || DEFAULT_TAG_ID}`));

    imported.forEach((log) => {
      const signature = `${log.startTime}|${log.endTime}|${log.durationSeconds}|${log.tagId || DEFAULT_TAG_ID}`;
      if (signatureSet.has(signature)) return;
      signatureSet.add(signature);
      merged.push(log);
    });

    merged.sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
    if (merged.length > MAX_SESSION_LOGS) {
      return merged.slice(merged.length - MAX_SESSION_LOGS);
    }
    return merged;
  };

  const triggerFileDownload = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const getExportFilenameBase = () => {
    const date = new Date().toISOString().split('T')[0];
    return `timer-history-${date}`;
  };

  const exportAsJson = async () => {
    const [historyRaw, sessionLogsRaw] = await Promise.all([
      AnalyticsModule.getHistory(),
      AnalyticsModule.getSessionLogs()
    ]);
    const history = normalizeHistory(historyRaw);
    const sessionLogs = normalizeSessionLogs(sessionLogsRaw);
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 2,
      history,
      sessionLogs
    };
    triggerFileDownload(
      `${getExportFilenameBase()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );

    setFeedback(`Exported JSON (${Object.keys(history).length} days, ${sessionLogs.length} sessions).`);
  };

  const exportAsCsv = async () => {
    const history = normalizeHistory(await AnalyticsModule.getHistory());
    const lines = ['date,time_spent_seconds,sessions'];
    Object.entries(history)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dateKey, entry]) => {
        lines.push(`${dateKey},${entry.timeSpent},${entry.sessions}`);
      });

    triggerFileDownload(
      `${getExportFilenameBase()}.csv`,
      lines.join('\n'),
      'text/csv;charset=utf-8'
    );

    setFeedback(`Exported CSV (${Object.keys(history).length} day entries).`);
  };

  const detectFileType = (file) => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.json') || file.type.includes('json')) return 'json';
    if (lowerName.endsWith('.csv') || file.type.includes('csv')) return 'csv';
    return 'unknown';
  };

  const importBackup = async () => {
    const fileInput = document.getElementById('backupImportFile');
    const modeSelect = document.getElementById('backupImportMode');
    if (!fileInput || !modeSelect) return;

    const file = fileInput.files?.[0];
    if (!file) {
      setFeedback('Choose a JSON or CSV file first.');
      return;
    }

    try {
      const content = await file.text();
      const fileType = detectFileType(file);

      let importedHistory = {};
      let importedSessionLogs = [];
      if (fileType === 'json') {
        const parsedBackup = parseJsonBackup(content);
        importedHistory = parsedBackup.history;
        importedSessionLogs = parsedBackup.sessionLogs;
      } else if (fileType === 'csv') {
        importedHistory = parseCsvHistory(content);
      } else {
        // Fallback: attempt JSON first, then CSV.
        try {
          const parsedBackup = parseJsonBackup(content);
          importedHistory = parsedBackup.history;
          importedSessionLogs = parsedBackup.sessionLogs;
        } catch (jsonError) {
          importedHistory = parseCsvHistory(content);
        }
      }

      const importedCount = Object.keys(importedHistory).length;
      const importedSessionCount = importedSessionLogs.length;
      if (importedCount === 0 && importedSessionCount === 0) {
        setFeedback('No valid entries found in file.');
        return;
      }

      const [existingHistoryRaw, existingSessionLogsRaw] = await Promise.all([
        AnalyticsModule.getHistory(),
        AnalyticsModule.getSessionLogs()
      ]);
      const existingHistory = normalizeHistory(existingHistoryRaw);
      const existingSessionLogs = normalizeSessionLogs(existingSessionLogsRaw);
      const importMode = modeSelect.value === 'replace' ? 'replace' : 'merge';
      const historyFromLogs = deriveHistoryFromSessionLogs(importedSessionLogs);

      let nextHistory;
      let nextSessionLogs;
      if (importMode === 'replace') {
        nextHistory = importedCount > 0 ? importedHistory : historyFromLogs;
        nextSessionLogs = normalizeSessionLogs(importedSessionLogs);
      } else {
        const mergeSourceHistory = importedCount > 0 ? importedHistory : historyFromLogs;
        nextHistory = mergeHistory(existingHistory, mergeSourceHistory);
        nextSessionLogs = mergeSessionLogs(existingSessionLogs, importedSessionLogs);
      }

      await StorageModule.setItem('analytics', nextHistory);
      await StorageModule.setItem(SESSION_LOGS_KEY, nextSessionLogs, { syncCloud: false });
      await AnalyticsModule.showAnalytics();
      fileInput.value = '';
      setFeedback(
        `Imported ${importedCount} day entries and ${importedSessionCount} sessions (${importMode === 'replace' ? 'replaced existing history' : 'merged safely without double-counting overlap'}).`
      );
    } catch (error) {
      console.error('Backup import failed:', error);
      setFeedback('Import failed. Please use a valid JSON/CSV backup file.');
    }
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.getElementById('exportJsonBtn')?.addEventListener('click', exportAsJson);
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportAsCsv);
    document.getElementById('importBackupBtn')?.addEventListener('click', importBackup);
    listenersBound = true;
  };

  const load = () => {
    bindEvents();
    setFeedback('');
  };

  return {
    load
  };
})();

// ToDoModule - Tagged tasks with disposable mode
const ToDoModule = (() => {
  const STORAGE_KEY = 'todoItems';
  const MODE_STORAGE_KEY = 'todoDisposableMode';
  const MAX_ITEMS = 250;
  const MAX_TEXT_LENGTH = 160;
  const DEFAULT_TAG_ID = 'tag-untagged';
  const DISPOSABLE_DURATION_MS = 24 * 60 * 60 * 1000;
  let items = [];
  let mode = { enabled: false, expiresAt: null };
  let tagFilter = 'all';
  let listenersBound = false;
  let countdownIntervalId = null;
  let expiringInProgress = false;

  const createItemId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `todo-${crypto.randomUUID()}`;
    }
    return `todo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  };

  const normalizeText = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').slice(0, MAX_TEXT_LENGTH);
  };

  const resolveTagId = (candidateTagId) => {
    if (typeof TagsModule !== 'undefined') {
      return TagsModule.resolveTagId(candidateTagId);
    }
    return typeof candidateTagId === 'string' ? candidateTagId : DEFAULT_TAG_ID;
  };

  const getAvailableTags = () => (
    typeof TagsModule !== 'undefined'
      ? TagsModule.getTags()
      : [{ id: DEFAULT_TAG_ID, name: 'Untagged', colorHex: '#616161' }]
  );

  const getTagMeta = (tagId) => {
    const tags = getAvailableTags();
    return tags.find((tag) => tag.id === resolveTagId(tagId)) || tags[0];
  };

  const sanitizeItems = (rawItems) => {
    if (!Array.isArray(rawItems)) return [];

    const seen = new Set();
    return rawItems
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const text = normalizeText(item.text);
        if (!text) return null;

        let id = typeof item.id === 'string' ? item.id.trim() : '';
        if (!id || seen.has(id)) {
          id = createItemId();
        }
        seen.add(id);

        return {
          id,
          text,
          completed: Boolean(item.completed),
          tagId: resolveTagId(item.tagId),
          createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now()
        };
      })
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
  };

  const sanitizeMode = (rawMode) => {
    if (!rawMode || typeof rawMode !== 'object') {
      return { enabled: false, expiresAt: null };
    }

    const enabled = Boolean(rawMode.enabled);
    const expiresAt = Number(rawMode.expiresAt);
    if (!enabled || !Number.isFinite(expiresAt)) {
      return { enabled: false, expiresAt: null };
    }

    return { enabled: true, expiresAt };
  };

  const setFeedback = (message = '') => {
    const feedbackEl = document.getElementById('todoFeedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
    }
  };

  const emitUpdated = () => {
    document.dispatchEvent(new CustomEvent('todo:updated', {
      detail: {
        items: items.map((item) => ({ ...item }))
      }
    }));
  };

  const getFilteredItems = () => {
    if (tagFilter === 'all') return items;
    return items.filter((item) => item.tagId === tagFilter);
  };

  const updateMeta = () => {
    const metaEl = document.getElementById('todoMeta');
    if (!metaEl) return;

    const filteredItems = getFilteredItems();
    const completedCount = filteredItems.filter((item) => item.completed).length;
    const totalCount = filteredItems.length;

    if (items.length === 0) {
      metaEl.textContent = '0 tasks';
      return;
    }

    if (tagFilter === 'all') {
      metaEl.textContent = `${completedCount}/${totalCount} completed`;
      return;
    }

    metaEl.textContent = `${completedCount}/${totalCount} completed • showing ${totalCount}`;
  };

  const persistItems = async () => {
    await StorageModule.setItem(STORAGE_KEY, items);
  };

  const persistMode = async () => {
    await StorageModule.setItem(MODE_STORAGE_KEY, mode);
  };

  const syncTagControls = () => {
    const todoTagSelect = document.getElementById('todoTagSelect');
    const todoFilterTag = document.getElementById('todoFilterTag');
    if (!(todoTagSelect instanceof HTMLSelectElement) || !(todoFilterTag instanceof HTMLSelectElement)) return;

    const previousCreateTag = todoTagSelect.value || resolveTagId(DEFAULT_TAG_ID);
    const previousFilter = todoFilterTag.value || tagFilter;
    const tags = getAvailableTags();

    todoTagSelect.innerHTML = '';
    tags.forEach((tag) => {
      const option = document.createElement('option');
      option.value = tag.id;
      option.textContent = tag.name;
      todoTagSelect.appendChild(option);
    });
    todoTagSelect.value = tags.some((tag) => tag.id === previousCreateTag)
      ? previousCreateTag
      : resolveTagId(DEFAULT_TAG_ID);

    todoFilterTag.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Filter by tags';
    todoFilterTag.appendChild(allOption);
    tags.forEach((tag) => {
      const option = document.createElement('option');
      option.value = tag.id;
      option.textContent = tag.name;
      todoFilterTag.appendChild(option);
    });

    if (previousFilter !== 'all' && !tags.some((tag) => tag.id === previousFilter)) {
      tagFilter = 'all';
    } else {
      tagFilter = previousFilter;
    }
    todoFilterTag.value = tagFilter;
  };

  const formatTimeLeft = (milliseconds) => {
    const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  };

  const updateModeUI = () => {
    const modeToggleBtn = document.getElementById('todoModeToggleBtn');
    const actionsWrap = document.getElementById('todoDisposableActions');
    const timeLeftBtn = document.getElementById('todoTimeLeftBtn');
    if (!modeToggleBtn || !actionsWrap || !timeLeftBtn) return;

    if (mode.enabled) {
      modeToggleBtn.textContent = 'Back';
      modeToggleBtn.classList.add('is-back');
      modeToggleBtn.setAttribute('aria-label', 'Back to normal to-do mode');
      actionsWrap.hidden = false;

      const remaining = Math.max(0, (mode.expiresAt || 0) - Date.now());
      timeLeftBtn.textContent = `${formatTimeLeft(remaining)} left`;
      return;
    }

    modeToggleBtn.textContent = 'Disposable Mode';
    modeToggleBtn.classList.remove('is-back');
    modeToggleBtn.setAttribute('aria-label', 'Enter disposable mode');
    actionsWrap.hidden = true;
    timeLeftBtn.textContent = '24h 00m left';
  };

  const stopCountdown = () => {
    if (countdownIntervalId !== null) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
  };

  const expireDisposableList = async (showFeedback = true) => {
    if (!mode.enabled || expiringInProgress) return;
    expiringInProgress = true;
    stopCountdown();

    items = [];
    mode = { enabled: false, expiresAt: null };
    await Promise.all([persistItems(), persistMode()]);
    render();
    updateModeUI();
    emitUpdated();
    if (showFeedback) {
      setFeedback('Disposable list expired and was deleted.');
    }

    expiringInProgress = false;
  };

  const refreshTimeLeft = () => {
    if (!mode.enabled) {
      updateModeUI();
      return;
    }

    const timeLeftBtn = document.getElementById('todoTimeLeftBtn');
    if (!timeLeftBtn) return;

    const remaining = (mode.expiresAt || 0) - Date.now();
    if (remaining <= 0) {
      timeLeftBtn.textContent = '0h 00m left';
      void expireDisposableList(true);
      return;
    }

    timeLeftBtn.textContent = `${formatTimeLeft(remaining)} left`;
  };

  const startCountdown = () => {
    stopCountdown();
    if (!mode.enabled) return;

    refreshTimeLeft();
    countdownIntervalId = window.setInterval(() => {
      refreshTimeLeft();
    }, 1000);
  };

  const render = () => {
    const listEl = document.getElementById('todoList');
    if (!listEl) return;

    const filteredItems = getFilteredItems();
    listEl.innerHTML = '';

    if (filteredItems.length === 0) {
      const emptyEl = document.createElement('li');
      emptyEl.className = 'todo-empty';
      emptyEl.textContent = tagFilter === 'all'
        ? 'No tasks yet. Add one to get started.'
        : 'No tasks found for this tag.';
      listEl.appendChild(emptyEl);
      updateMeta();
      return;
    }

    filteredItems.forEach((item) => {
      const tagMeta = getTagMeta(item.tagId);
      const row = document.createElement('li');
      row.className = `todo-item${item.completed ? ' is-done' : ''}`;

      const main = document.createElement('div');
      main.className = 'todo-main';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-check';
      checkbox.dataset.id = item.id;
      checkbox.checked = item.completed;
      checkbox.id = `todo-check-${item.id}`;
      checkbox.setAttribute('aria-label', `Mark task: ${item.text}`);

      const textWrap = document.createElement('div');
      textWrap.className = 'todo-text-wrap';

      const text = document.createElement('label');
      text.className = 'todo-text';
      text.setAttribute('for', checkbox.id);
      text.textContent = item.text;

      const tagBadge = document.createElement('span');
      tagBadge.className = 'todo-tag-badge';
      tagBadge.textContent = tagMeta.name;
      tagBadge.style.setProperty('--tag-color', tagMeta.colorHex);

      textWrap.appendChild(text);
      textWrap.appendChild(tagBadge);

      main.appendChild(checkbox);
      main.appendChild(textWrap);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'todo-delete-btn';
      deleteBtn.dataset.id = item.id;
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${item.text}`);

      row.appendChild(main);
      row.appendChild(deleteBtn);
      listEl.appendChild(row);
    });

    updateMeta();
  };

  const addItem = async (rawText, rawTagId) => {
    const text = normalizeText(rawText);
    if (!text) {
      setFeedback('Enter a task first.');
      return false;
    }

    if (items.length >= MAX_ITEMS) {
      setFeedback(`Task limit reached (${MAX_ITEMS}). Delete a few items first.`);
      return false;
    }

    items = [
      {
        id: createItemId(),
        text,
        completed: false,
        tagId: resolveTagId(rawTagId),
        createdAt: Date.now()
      },
      ...items
    ];
    await persistItems();
    render();
    emitUpdated();
    setFeedback('Task added.');
    return true;
  };

  const toggleItem = async (id, completed) => {
    let changed = false;
    items = items.map((item) => {
      if (item.id !== id) return item;
      changed = true;
      return { ...item, completed: Boolean(completed) };
    });

    if (!changed) return;
    await persistItems();
    render();
    emitUpdated();
    setFeedback(completed ? 'Task completed.' : 'Task marked active.');
  };

  const deleteItem = async (id) => {
    const nextItems = items.filter((item) => item.id !== id);
    if (nextItems.length === items.length) return;

    items = nextItems;
    await persistItems();
    render();
    emitUpdated();
    setFeedback('Task deleted.');
  };

  const toggleMode = async () => {
    if (mode.enabled) {
      mode = { enabled: false, expiresAt: null };
      await persistMode();
      stopCountdown();
      updateModeUI();
      setFeedback('');
      return;
    }

    const confirmed = confirm('Enter disposable mode? This list will auto-delete in 24 hours.');
    if (!confirmed) return;

    mode = {
      enabled: true,
      expiresAt: Date.now() + DISPOSABLE_DURATION_MS
    };
    await persistMode();
    updateModeUI();
    startCountdown();
    setFeedback('Disposable mode enabled. This list will auto-delete in 24 hours.');
  };

  const deleteEntireList = async () => {
    if (!mode.enabled) return;

    const confirmed = confirm('Delete the entire disposable to-do list now?');
    if (!confirmed) return;

    items = [];
    await persistItems();
    render();
    emitUpdated();
    setFeedback('Entire list deleted.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const input = document.getElementById('todoInput');
    const tagSelect = document.getElementById('todoTagSelect');
    if (!(input instanceof HTMLInputElement) || !(tagSelect instanceof HTMLSelectElement)) return;

    const didAdd = await addItem(input.value, tagSelect.value);
    if (didAdd) {
      input.value = '';
      input.focus();
    }
  };

  const bindEvents = () => {
    if (listenersBound) return;

    const form = document.getElementById('todoForm');
    const list = document.getElementById('todoList');
    const modeToggleBtn = document.getElementById('todoModeToggleBtn');
    const deleteAllBtn = document.getElementById('todoDeleteAllBtn');
    const filterSelect = document.getElementById('todoFilterTag');

    form?.addEventListener('submit', handleSubmit);
    modeToggleBtn?.addEventListener('click', () => {
      void toggleMode();
    });
    deleteAllBtn?.addEventListener('click', () => {
      void deleteEntireList();
    });

    filterSelect?.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      tagFilter = target.value;
      render();
    });

    list?.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || !target.classList.contains('todo-check')) {
        return;
      }

      const id = target.dataset.id;
      if (!id) return;
      void toggleItem(id, target.checked);
    });

    list?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const button = target.closest('.todo-delete-btn');
      if (!(button instanceof HTMLButtonElement)) return;
      const id = button.dataset.id;
      if (!id) return;
      void deleteItem(id);
    });

    document.addEventListener('tags:updated', () => {
      const nextItems = items.map((item) => ({
        ...item,
        tagId: resolveTagId(item.tagId)
      }));
      const changed = JSON.stringify(nextItems.map((item) => item.tagId)) !== JSON.stringify(items.map((item) => item.tagId));
      items = nextItems;
      syncTagControls();
      render();
      emitUpdated();
      if (changed) {
        void persistItems();
      }
    });

    listenersBound = true;
  };

  const load = async () => {
    const [storedItems, storedMode] = await Promise.all([
      StorageModule.getItem(STORAGE_KEY),
      StorageModule.getItem(MODE_STORAGE_KEY)
    ]);
    items = sanitizeItems(storedItems);
    mode = sanitizeMode(storedMode);
    tagFilter = 'all';

    bindEvents();
    syncTagControls();
    render();
    updateModeUI();
    setFeedback('');
    emitUpdated();

    if (mode.enabled && (mode.expiresAt || 0) <= Date.now()) {
      await expireDisposableList(true);
      return;
    }

    if (mode.enabled) {
      startCountdown();
    }
  };

  return {
    load,
    getItems: () => items.map((item) => ({ ...item }))
  };
})();

// NotesModule - Rich notes editor with recent previews and full notes window
const NotesModule = (() => {
  const STORAGE_KEY = 'notesItems';
  const LAYOUT_KEY = 'notesRecentCount';
  const DEFAULT_RECENT_COUNT = 4;
  const ALLOWED_RECENT_COUNTS = [2, 4, 6];
  const MAX_NOTES = 500;
  const MAX_NOTE_CHARS = 12000;
  const ALLOWED_TAGS = new Set([
    'BR', 'P', 'DIV', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE',
    'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE'
  ]);

  let notes = [];
  let recentCount = DEFAULT_RECENT_COUNT;
  let libraryOpen = false;
  let listenersBound = false;

  const createNoteId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `note-${crypto.randomUUID()}`;
    }
    return `note-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  };

  const sanitizeRecentCount = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_RECENT_COUNT;
    return ALLOWED_RECENT_COUNTS.includes(parsed) ? parsed : DEFAULT_RECENT_COUNT;
  };

  const extractPlainText = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || '';
  };

  const sanitizeRichText = (rawHtml) => {
    const source = typeof rawHtml === 'string' ? rawHtml : '';
    if (!source.trim()) return '';

    const template = document.createElement('template');
    template.innerHTML = source;

    const sanitizeNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.nodeValue || '');
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createDocumentFragment();
      }

      const tagName = node.tagName.toUpperCase();
      const fragment = document.createDocumentFragment();
      const normalizedTag = tagName === 'B'
        ? 'STRONG'
        : tagName === 'I'
          ? 'EM'
          : tagName === 'STRIKE'
            ? 'S'
            : tagName;

      if (!ALLOWED_TAGS.has(tagName)) {
        Array.from(node.childNodes).forEach((child) => {
          fragment.appendChild(sanitizeNode(child));
        });
        return fragment;
      }

      const element = document.createElement(normalizedTag.toLowerCase());
      if (normalizedTag === 'BR') {
        return element;
      }

      Array.from(node.childNodes).forEach((child) => {
        element.appendChild(sanitizeNode(child));
      });

      return element;
    };

    const container = document.createElement('div');
    Array.from(template.content.childNodes).forEach((node) => {
      container.appendChild(sanitizeNode(node));
    });

    return container.innerHTML.trim();
  };

  const formatNoteTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const excerptText = (plainText, maxLength = 120) => {
    const compact = plainText.trim().replace(/\s+/g, ' ');
    if (compact.length <= maxLength) return compact;
    return `${compact.slice(0, maxLength).trimEnd()}...`;
  };

  const sanitizeNotes = (rawNotes) => {
    if (!Array.isArray(rawNotes)) return [];

    const seen = new Set();
    return rawNotes
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        let id = typeof item.id === 'string' ? item.id.trim() : '';
        if (!id || seen.has(id)) {
          id = createNoteId();
        }
        seen.add(id);

        const html = sanitizeRichText(item.html || item.content || '');
        const plainText = extractPlainText(html).trim();
        if (!plainText) return null;

        const createdAt = Number.isFinite(item.createdAt) ? item.createdAt : Date.now();
        const updatedAt = Number.isFinite(item.updatedAt) ? item.updatedAt : createdAt;
        return {
          id,
          html,
          plainText,
          createdAt,
          updatedAt
        };
      })
      .filter(Boolean)
      .sort((first, second) => second.updatedAt - first.updatedAt)
      .slice(0, MAX_NOTES);
  };

  const setFeedback = (message = '') => {
    const feedbackEl = document.getElementById('notesFeedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
    }
  };

  const getEditor = () => document.getElementById('noteEditor');

  const clearEditor = () => {
    const editor = getEditor();
    if (!editor) return;
    editor.innerHTML = '';
  };

  const persistNotes = async () => {
    await StorageModule.setItem(STORAGE_KEY, notes);
  };

  const persistRecentCount = async () => {
    await StorageModule.setItem(LAYOUT_KEY, recentCount);
  };

  const updateLayoutControls = () => {
    document.querySelectorAll('.notes-layout-btn').forEach((button) => {
      const targetCount = Number.parseInt(button.dataset.noteCount || '', 10);
      button.classList.toggle('is-active', targetCount === recentCount);
    });
  };

  const updateListHeight = () => {
    const listEl = document.getElementById('notesRecentList');
    if (!listEl) return;
    
    // Remove all count classes
    listEl.classList.remove('notes-count-2', 'notes-count-4', 'notes-count-6');
    
    // Add appropriate class based on recentCount
    listEl.classList.add(`notes-count-${recentCount}`);
  };

  const renderRecent = () => {
    const metaEl = document.getElementById('notesRecentMeta');
    const listEl = document.getElementById('notesRecentList');
    if (!metaEl || !listEl) return;

    updateLayoutControls();
    updateListHeight();
    const recent = notes.slice(0, recentCount);
    metaEl.textContent = `Showing ${recent.length} of ${notes.length} note${notes.length === 1 ? '' : 's'}`;

    listEl.innerHTML = '';
    if (recent.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'notes-recent-empty';
      empty.textContent = 'No notes yet. Write one and save it.';
      listEl.appendChild(empty);
      return;
    }

    recent.forEach((note) => {
      const item = document.createElement('li');
      item.className = 'notes-recent-item';

      const title = document.createElement('p');
      title.className = 'notes-recent-item-title';
      title.textContent = excerptText(note.plainText, 110);

      const meta = document.createElement('p');
      meta.className = 'notes-recent-item-meta';
      meta.textContent = formatNoteTimestamp(note.updatedAt);

      item.appendChild(title);
      item.appendChild(meta);
      listEl.appendChild(item);
    });
  };

  const renderLibrary = () => {
    const metaEl = document.getElementById('notesLibraryMeta');
    const listEl = document.getElementById('notesLibraryList');
    if (!metaEl || !listEl) return;

    metaEl.textContent = `${notes.length} note${notes.length === 1 ? '' : 's'} saved`;
    listEl.innerHTML = '';

    if (notes.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'notes-library-empty';
      empty.textContent = 'No saved notes yet.';
      listEl.appendChild(empty);
      return;
    }

    notes.forEach((note) => {
      const item = document.createElement('li');
      item.className = 'notes-library-item';

      const head = document.createElement('div');
      head.className = 'notes-library-item-head';

      const meta = document.createElement('p');
      meta.className = 'notes-library-item-meta';
      meta.textContent = formatNoteTimestamp(note.updatedAt);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'notes-library-delete-btn';
      deleteBtn.dataset.noteId = note.id;
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete note from ${formatNoteTimestamp(note.updatedAt)}`);

      const body = document.createElement('div');
      body.className = 'notes-library-item-body';
      body.innerHTML = note.html;

      head.appendChild(meta);
      head.appendChild(deleteBtn);
      item.appendChild(head);
      item.appendChild(body);
      listEl.appendChild(item);
    });
  };

  const setLibraryOpen = (nextOpen) => {
    const modal = document.getElementById('notesLibraryModal');
    const backdrop = document.getElementById('notesLibraryBackdrop');
    if (!modal || !backdrop) return;

    libraryOpen = nextOpen;
    modal.hidden = !nextOpen;
    backdrop.hidden = !nextOpen;

    if (nextOpen) {
      renderLibrary();
      document.getElementById('notesLibraryCloseBtn')?.focus();
    } else {
      document.getElementById('notesRecentPane')?.focus();
    }
  };

  const saveNote = async () => {
    const editor = getEditor();
    if (!editor) return;

    const html = sanitizeRichText(editor.innerHTML);
    const plainText = extractPlainText(html).trim();
    if (!plainText) {
      setFeedback('Write something before saving.');
      editor.focus();
      return;
    }

    if (plainText.length > MAX_NOTE_CHARS) {
      setFeedback(`Keep note under ${MAX_NOTE_CHARS} characters.`);
      return;
    }

    const now = Date.now();
    notes = [
      {
        id: createNoteId(),
        html,
        plainText,
        createdAt: now,
        updatedAt: now
      },
      ...notes
    ].slice(0, MAX_NOTES);

    await persistNotes();
    renderRecent();
    if (libraryOpen) {
      renderLibrary();
    }
    clearEditor();
    editor.focus();
    setFeedback('Note saved.');
  };

  const discardDraft = () => {
    clearEditor();
    setFeedback('Draft cleared.');
    getEditor()?.focus();
  };

  const deleteNote = async (noteId) => {
    const target = notes.find((note) => note.id === noteId);
    if (!target) return;

    const confirmed = confirm('Delete this note?');
    if (!confirmed) return;

    notes = notes.filter((note) => note.id !== noteId);
    await persistNotes();
    renderRecent();
    renderLibrary();
    setFeedback('Note deleted.');
  };

  const runClipboardCommand = async (command) => {
    const editor = getEditor();
    if (!editor) return;
    editor.focus();

    if (['bold', 'italic', 'underline', 'strikeThrough', 'copy', 'cut'].includes(command)) {
      const ok = document.execCommand(command);
      if (!ok) {
        setFeedback(`Could not run ${command}.`);
      }
      return;
    }

    if (command === 'paste') {
      try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          const inserted = document.execCommand('insertText', false, clipboardText);
          if (!inserted) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
              editor.append(document.createTextNode(clipboardText));
            } else {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(document.createTextNode(clipboardText));
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      } catch (error) {
        setFeedback('Paste blocked by browser. Use keyboard paste (Ctrl/Cmd + V).');
      }
    }
  };

  const handleRecentPaneActivation = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.notes-layout-btn') || target.closest('.notes-layout-controls')) return;
    setLibraryOpen(true);
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.getElementById('saveNoteBtn')?.addEventListener('click', () => {
      void saveNote();
    });
    document.getElementById('discardNoteBtn')?.addEventListener('click', discardDraft);

    document.querySelector('.notes-toolbar')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('.notes-tool-btn');
      if (!(button instanceof HTMLButtonElement)) return;

      const command = button.dataset.noteTool;
      if (!command) return;
      void runClipboardCommand(command);
    });

    document.querySelector('.notes-layout-controls')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('.notes-layout-btn');
      if (!(button instanceof HTMLButtonElement)) return;

      event.stopPropagation();
      const nextCount = sanitizeRecentCount(button.dataset.noteCount);
      if (nextCount === recentCount) return;
      recentCount = nextCount;
      updateListHeight();
      renderRecent();
      void persistRecentCount();
    });

    const recentPane = document.getElementById('notesRecentPane');
    recentPane?.addEventListener('click', handleRecentPaneActivation);
    recentPane?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      handleRecentPaneActivation(event);
    });

    document.getElementById('notesLibraryCloseBtn')?.addEventListener('click', () => {
      setLibraryOpen(false);
    });
    document.getElementById('notesLibraryBackdrop')?.addEventListener('click', () => {
      setLibraryOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && libraryOpen) {
        setLibraryOpen(false);
      }
    });

    document.getElementById('notesLibraryList')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('.notes-library-delete-btn');
      if (!(button instanceof HTMLButtonElement)) return;

      const noteId = button.dataset.noteId;
      if (!noteId) return;
      void deleteNote(noteId);
    });

    listenersBound = true;
  };

  const load = async () => {
    const [storedNotes, storedRecentCount] = await Promise.all([
      StorageModule.getItem(STORAGE_KEY),
      StorageModule.getItem(LAYOUT_KEY)
    ]);
    notes = sanitizeNotes(storedNotes);
    recentCount = sanitizeRecentCount(storedRecentCount);

    bindEvents();
    renderRecent();
    renderLibrary();
    setFeedback('');
  };

  return {
    load
  };
})();

// TagReportsModule - Aggregated tag analytics across sessions and tasks
const TagReportsModule = (() => {
  let tagUsageChart = null;
  let listenersBound = false;

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, Number.parseInt(seconds, 10) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const hexToRgba = (hex, alpha) => {
    const normalized = typeof hex === 'string' ? hex.replace('#', '') : '';
    if (!/^[\da-fA-F]{6}$/.test(normalized)) {
      return `rgba(0, 0, 0, ${alpha})`;
    }

    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  };

  const getRangeStartMs = (rangeKey) => {
    if (rangeKey === 'all') return null;
    const now = Date.now();
    if (rangeKey === '30d') return now - (30 * 24 * 60 * 60 * 1000);
    return now - (7 * 24 * 60 * 60 * 1000);
  };

  const sessionInRange = (session, rangeStartMs) => {
    if (rangeStartMs === null) return true;
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    return end >= rangeStartMs;
  };

  const todoInRange = (todoItem, rangeStartMs) => {
    if (rangeStartMs === null) return true;
    const createdAt = Number(todoItem.createdAt);
    if (!Number.isFinite(createdAt)) return false;
    return createdAt >= rangeStartMs;
  };

  const aggregate = async (rangeKey) => {
    const rangeStartMs = getRangeStartMs(rangeKey);
    const [sessionLogs, tags] = await Promise.all([
      AnalyticsModule.getSessionLogs(),
      Promise.resolve(TagsModule.getTags())
    ]);
    const todoItems = typeof ToDoModule.getItems === 'function' ? ToDoModule.getItems() : [];

    const metricsMap = new Map(
      tags.map((tag) => [tag.id, {
        tagId: tag.id,
        name: tag.name,
        colorHex: tag.colorHex,
        seconds: 0,
        sessions: 0,
        tasks: 0,
        tasksDone: 0
      }])
    );

    const ensureMetric = (rawTagId) => {
      const tagId = TagsModule.resolveTagId(rawTagId);
      if (!metricsMap.has(tagId)) {
        metricsMap.set(tagId, {
          tagId,
          name: TagsModule.getTagName(tagId),
          colorHex: TagsModule.getTagColor(tagId),
          seconds: 0,
          sessions: 0,
          tasks: 0,
          tasksDone: 0
        });
      }

      return metricsMap.get(tagId);
    };

    sessionLogs.forEach((session) => {
      if (!sessionInRange(session, rangeStartMs)) return;
      const metric = ensureMetric(session.tagId);
      metric.seconds += Number.parseInt(session.durationSeconds, 10) || 0;
      metric.sessions += 1;
    });

    todoItems.forEach((item) => {
      if (!todoInRange(item, rangeStartMs)) return;
      const metric = ensureMetric(item.tagId);
      metric.tasks += 1;
      if (item.completed) {
        metric.tasksDone += 1;
      }
    });

    const metrics = [...metricsMap.values()]
      .filter((metric) => metric.seconds > 0 || metric.sessions > 0 || metric.tasks > 0)
      .sort((first, second) => (
        second.seconds - first.seconds
        || second.sessions - first.sessions
        || second.tasks - first.tasks
        || first.name.localeCompare(second.name)
      ));

    return {
      metrics,
      totalSeconds: metrics.reduce((sum, metric) => sum + metric.seconds, 0),
      totalSessions: metrics.reduce((sum, metric) => sum + metric.sessions, 0),
      totalTasks: metrics.reduce((sum, metric) => sum + metric.tasks, 0)
    };
  };

  const renderList = (metrics) => {
    const listEl = document.getElementById('tagReportList');
    if (!listEl) return;

    if (metrics.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No tagged activity in this range yet.</p>';
      return;
    }

    const rows = metrics.map((metric) => `
      <article class="tag-report-item">
        <div class="tag-report-id">
          <span class="tag-swatch" style="--tag-color: ${metric.colorHex}" aria-hidden="true"></span>
          <strong>${metric.name}</strong>
        </div>
        <div class="tag-report-metrics">
          <span>${formatDuration(metric.seconds)}</span>
          <span>${metric.sessions} session${metric.sessions === 1 ? '' : 's'}</span>
          <span>${metric.tasksDone}/${metric.tasks} task${metric.tasks === 1 ? '' : 's'} done</span>
        </div>
      </article>
    `).join('');

    listEl.innerHTML = rows;
  };

  const updateChart = (metrics) => {
    const canvas = document.getElementById('tagUsageChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tagUsageChart) {
      tagUsageChart.destroy();
    }

    const styles = getComputedStyle(document.body);
    const textColor = styles.getPropertyValue('--text').trim();
    const gridColor = styles.getPropertyValue('--grid').trim();
    const bgColor = styles.getPropertyValue('--bg').trim();

    tagUsageChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: metrics.map((metric) => metric.name),
        datasets: [{
          label: 'Time Used (Hours)',
          data: metrics.map((metric) => Number((metric.seconds / 3600).toFixed(2))),
          backgroundColor: metrics.map((metric) => hexToRgba(metric.colorHex, 0.5)),
          borderColor: metrics.map((metric) => metric.colorHex),
          borderWidth: 1,
          borderSkipped: false,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: textColor,
            titleColor: bgColor,
            bodyColor: bgColor
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  };

  const refresh = async () => {
    const rangeSelect = document.getElementById('tagReportRange');
    const summaryEl = document.getElementById('tagReportSummary');
    if (!rangeSelect || !summaryEl) return;

    const rangeKey = rangeSelect.value || '7d';
    const result = await aggregate(rangeKey);

    if (result.metrics.length === 0) {
      summaryEl.textContent = 'No tagged sessions yet.';
      renderList([]);
      updateChart([]);
      return;
    }

    summaryEl.textContent = `${formatDuration(result.totalSeconds)} across ${result.totalSessions} sessions • ${result.totalTasks} tagged tasks`;
    renderList(result.metrics);
    updateChart(result.metrics);
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.getElementById('tagReportRange')?.addEventListener('change', () => {
      void refresh();
    });

    document.addEventListener('analytics:updated', () => {
      void refresh();
    });
    document.addEventListener('todo:updated', () => {
      void refresh();
    });
    document.addEventListener('tags:updated', () => {
      void refresh();
    });

    listenersBound = true;
  };

  const load = async () => {
    bindEvents();
    await refresh();
  };

  return {
    load,
    refresh
  };
})();

// HeatmapModule - GitHub-style daily consistency grid
const HeatmapModule = (() => {
  const STORAGE_KEY = 'heatmapRange';
  const DEFAULT_RANGE = '1y';
  const RANGE_DAYS = {
    '3m': 92,
    '6m': 183,
    '1y': 365
  };

  let currentRange = DEFAULT_RANGE;
  let listenersBound = false;

  const sanitizeRange = (value) => {
    if (typeof value !== 'string') return DEFAULT_RANGE;
    return Object.prototype.hasOwnProperty.call(RANGE_DAYS, value) ? value : DEFAULT_RANGE;
  };

  const formatDateKeyUTC = (date) => date.toISOString().split('T')[0];

  const parseDateKey = (dateKey) => {
    const parsed = new Date(`${dateKey}T12:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, Number.parseInt(seconds, 10) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const getRangeBounds = (range) => {
    const totalDays = RANGE_DAYS[range] || RANGE_DAYS[DEFAULT_RANGE];
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (totalDays - 1));

    return { start, end, totalDays };
  };

  const normalizeHistory = (history) => {
    const map = new Map();
    Object.entries(history || {}).forEach(([dateKey, entry]) => {
      if (!entry || typeof entry !== 'object') return;
      const seconds = Math.max(0, Number.parseInt(entry.timeSpent, 10) || 0);
      const sessions = Math.max(0, Number.parseInt(entry.sessions, 10) || 0);
      map.set(dateKey, { seconds, sessions });
    });
    return map;
  };

  const buildRangeDates = (start, end) => {
    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
  };

  const getIntensityLevel = (seconds, maxSeconds) => {
    if (seconds <= 0 || maxSeconds <= 0) return 0;

    const normalized = Math.log1p(seconds) / Math.log1p(maxSeconds);
    if (normalized <= 0.25) return 1;
    if (normalized <= 0.5) return 2;
    if (normalized <= 0.75) return 3;
    return 4;
  };

  const setRangeButtons = () => {
    document.querySelectorAll('.heatmap-range-btn').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.heatmapRange === currentRange);
    });
  };

  const updateSummary = (activeDays, totalSeconds, totalDays) => {
    const summaryEl = document.getElementById('heatmapSummary');
    if (!summaryEl) return;
    summaryEl.textContent = `${activeDays}/${totalDays} active days • ${formatDuration(totalSeconds)} total`;
  };

  const renderGrid = (rangeDates, historyMap, start, end) => {
    const gridEl = document.getElementById('heatmapGrid');
    if (!gridEl) return;

    const rangeDateSet = new Set(rangeDates.map((date) => formatDateKeyUTC(date)));
    const values = rangeDates
      .map((date) => {
        const key = formatDateKeyUTC(date);
        return historyMap.get(key)?.seconds || 0;
      });
    const maxSeconds = Math.max(...values, 0);

    const gridStart = new Date(start);
    gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

    const gridEnd = new Date(end);
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

    const fragment = document.createDocumentFragment();
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const dateKey = formatDateKeyUTC(cursor);
      const inRange = rangeDateSet.has(dateKey);
      const entry = historyMap.get(dateKey) || { seconds: 0, sessions: 0 };
      const level = inRange ? getIntensityLevel(entry.seconds, maxSeconds) : 0;

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `heatmap-cell level-${level}${inRange ? '' : ' is-outside'}`;
      if (!inRange) {
        cell.disabled = true;
        cell.setAttribute('aria-hidden', 'true');
        cell.tabIndex = -1;
      } else {
        cell.dataset.date = dateKey;
        const dateText = parseDateKey(dateKey)?.toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) || dateKey;
        const sessionCount = entry.sessions || 0;
        cell.setAttribute(
          'aria-label',
          `${dateText}: ${formatDuration(entry.seconds)} in ${sessionCount} session${sessionCount === 1 ? '' : 's'}`
        );
      }

      fragment.appendChild(cell);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    gridEl.innerHTML = '';
    gridEl.appendChild(fragment);
  };

  const refresh = async (historyOverride = null) => {
    setRangeButtons();

    const history = historyOverride || await AnalyticsModule.getHistory();
    const historyMap = normalizeHistory(history);
    const { start, end, totalDays } = getRangeBounds(currentRange);
    const rangeDates = buildRangeDates(start, end);

    let activeDays = 0;
    let totalSeconds = 0;
    rangeDates.forEach((date) => {
      const key = formatDateKeyUTC(date);
      const seconds = historyMap.get(key)?.seconds || 0;
      totalSeconds += seconds;
      if (seconds > 0) {
        activeDays += 1;
      }
    });

    updateSummary(activeDays, totalSeconds, totalDays);
    renderGrid(rangeDates, historyMap, start, end);
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.querySelector('.heatmap-range-controls')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('.heatmap-range-btn');
      if (!(button instanceof HTMLButtonElement)) return;

      const nextRange = sanitizeRange(button.dataset.heatmapRange);
      if (nextRange === currentRange) return;

      currentRange = nextRange;
      setRangeButtons();
      void StorageModule.setItem(STORAGE_KEY, currentRange);
      void refresh();
    });

    document.getElementById('heatmapGrid')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const cell = target.closest('.heatmap-cell');
      if (!(cell instanceof HTMLButtonElement)) return;
      const dateKey = cell.dataset.date;
      if (!dateKey) return;
      if (typeof DailyReportModule !== 'undefined') {
        DailyReportModule.open(dateKey);
      }
    });

    document.addEventListener('analytics:updated', (event) => {
      void refresh(event.detail?.history || {});
    });

    listenersBound = true;
  };

  const load = async () => {
    currentRange = sanitizeRange(await StorageModule.getItem(STORAGE_KEY));
    bindEvents();
    await refresh();
  };

  return {
    load,
    refresh
  };
})();

// DailyReportModule - Per-day detailed session report
const DailyReportModule = (() => {
  let open = false;
  let listenersBound = false;

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, Number.parseInt(seconds, 10) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const setOpen = (nextOpen) => {
    const panel = document.getElementById('dailyReportPanel');
    const backdrop = document.getElementById('dailyReportBackdrop');
    if (!panel || !backdrop) return;

    open = nextOpen;
    panel.hidden = !nextOpen;
    backdrop.hidden = !nextOpen;

    if (nextOpen) {
      document.getElementById('dailyReportCloseBtn')?.focus();
    } else {
      document.getElementById('analyticsFilterInput')?.focus();
    }
  };

  const close = () => {
    setOpen(false);
  };

  const renderSummary = (report) => {
    const summary = document.getElementById('dailyReportSummary');
    if (!summary) return;

    const detailedCount = report.sessions.length;
    const averageSeconds = detailedCount > 0
      ? Math.floor(report.sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / detailedCount)
      : (report.sessionCount > 0 ? Math.floor(report.totalSeconds / report.sessionCount) : 0);
    const longestSeconds = detailedCount > 0
      ? Math.max(...report.sessions.map((session) => session.durationSeconds))
      : 0;

    summary.innerHTML = `
      <article class="report-card">
        <p class="report-card-label">Total Time</p>
        <p class="report-card-value">${formatDuration(report.totalSeconds)}</p>
      </article>
      <article class="report-card">
        <p class="report-card-label">Sessions</p>
        <p class="report-card-value">${report.sessionCount}</p>
      </article>
      <article class="report-card">
        <p class="report-card-label">Avg Session</p>
        <p class="report-card-value">${formatDuration(averageSeconds)}</p>
      </article>
      <article class="report-card">
        <p class="report-card-label">Longest</p>
        <p class="report-card-value">${formatDuration(longestSeconds)}</p>
      </article>
    `;
  };

  const renderSessions = (report) => {
    const sessionsRoot = document.getElementById('dailyReportSessions');
    if (!sessionsRoot) return;

    if (report.sessions.length === 0) {
      sessionsRoot.innerHTML = `
        <p class="report-empty">
          Detailed per-session logs are unavailable for this day. This usually applies to older data before session logging was enabled.
        </p>
      `;
      return;
    }

    const items = report.sessions.map((session, index) => `
      <li class="report-session-item">
        <span><strong>#${index + 1}</strong></span>
        <span>${formatTime(session.segmentStart || session.startTime)} - ${formatTime(session.segmentEnd || session.endTime)}</span>
        <span>${formatDuration(session.durationSeconds)}${session.isClipped ? ' (carry-over)' : ''} • ${(typeof TagsModule !== 'undefined' ? TagsModule.getTagName(session.tagId) : 'Untagged')}</span>
      </li>
    `).join('');

    sessionsRoot.innerHTML = `<ul class="report-session-list">${items}</ul>`;
  };

  const openReport = async (dateKey) => {
    const report = await AnalyticsModule.getDailyReport(dateKey);
    document.getElementById('dailyReportDate').textContent = report.dateKey;
    renderSummary(report);
    renderSessions(report);
    setOpen(true);
  };

  const bindEvents = () => {
    if (listenersBound) return;

    document.getElementById('dailyReportCloseBtn')?.addEventListener('click', close);
    document.getElementById('dailyReportBackdrop')?.addEventListener('click', close);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && open) {
        close();
      }
    });
    listenersBound = true;
  };

  const init = () => {
    bindEvents();
  };

  return {
    init,
    open: openReport,
    close,
    isOpen: () => open
  };
})();

const syncTimerUIState = () => {
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const statusText = document.getElementById('statusText');

  if (!startBtn || !pauseBtn || !statusText) return;

  const paused = TimerModule.isPaused();
  const remaining = TimerModule.getTotalSeconds();

  startBtn.disabled = !paused || remaining <= 0;
  pauseBtn.disabled = paused;

  if (remaining <= 0) {
    statusText.textContent = 'Completed';
    statusText.dataset.state = 'done';
    PresetModule.highlightActivePreset();
    return;
  }

  if (paused) {
    statusText.textContent = 'Paused';
    statusText.dataset.state = 'paused';
  } else {
    statusText.textContent = 'Running';
    statusText.dataset.state = 'running';
  }

  PresetModule.highlightActivePreset();
};

// ClockModule - Header clock synced to system time
const ClockModule = (() => {
  const STORAGE_KEY = 'clockUtcOffsetMinutes';
  const DEFAULT_OFFSET_MINUTES = 330;
  const OFFSET_OPTIONS = [
    -720, -660, -600, -570, -540, -480, -420, -360, -300, -240,
    -210, -180, -120, -60, 0, 60, 120, 180, 210, 240, 270, 300,
    330, 345, 360, 390, 420, 480, 525, 540, 570, 600, 630, 660,
    720, 765, 780, 840
  ];
  let started = false;
  let secondIntervalId = null;
  let panelOpen = false;
  let utcOffsetMinutes = DEFAULT_OFFSET_MINUTES;
  let calendarMonthShift = 0;
  let lastCalendarKey = '';

  const formatOffsetLabel = (offsetMinutes) => {
    const safeOffset = Number.isFinite(offsetMinutes) ? offsetMinutes : 0;
    const sign = safeOffset >= 0 ? '+' : '-';
    const absoluteMinutes = Math.abs(safeOffset);
    const hours = Math.floor(absoluteMinutes / 60);
    const mins = absoluteMinutes % 60;
    return `${sign}${hours}:${String(mins).padStart(2, '0')}`;
  };

  const sanitizeOffset = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_OFFSET_MINUTES;
    return OFFSET_OPTIONS.includes(parsed) ? parsed : DEFAULT_OFFSET_MINUTES;
  };

  const getClockDateForOffset = (date, offsetMinutes) => {
    const safeOffset = Number.isFinite(offsetMinutes) ? offsetMinutes : 0;
    return new Date(date.getTime() + (safeOffset * 60 * 1000));
  };

  const formatHeaderTime = (date, offsetMinutes) => {
    const clockDate = getClockDateForOffset(date, offsetMinutes);
    const hours24 = clockDate.getUTCHours();
    const hours12 = hours24 % 12 || 12;
    const mins = String(clockDate.getUTCMinutes()).padStart(2, '0');
    const period = hours24 >= 12 ? 'PM' : 'AM';
    return `[${period} ${hours12}:${mins}]`;
  };

  const formatUtcTime = (date, offsetMinutes) => {
    const clockDate = getClockDateForOffset(date, offsetMinutes);
    const hours = String(clockDate.getUTCHours()).padStart(2, '0');
    const mins = String(clockDate.getUTCMinutes()).padStart(2, '0');
    const secs = String(clockDate.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  };

  const formatUtcDate = (date, offsetMinutes) => {
    const clockDate = getClockDateForOffset(date, offsetMinutes);
    const day = String(clockDate.getUTCDate()).padStart(2, '0');
    const month = clockDate.toLocaleDateString('en-US', {
      month: 'long',
      timeZone: 'UTC'
    });
    const year = clockDate.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  const renderCalendar = (date, offsetMinutes) => {
    const monthEl = document.getElementById('clockCalendarMonth');
    const gridEl = document.getElementById('clockCalendarGrid');
    if (!monthEl || !gridEl) return;

    const clockDate = getClockDateForOffset(date, offsetMinutes);
    const currentYear = clockDate.getUTCFullYear();
    const currentMonth = clockDate.getUTCMonth();
    const currentDay = clockDate.getUTCDate();

    const viewDate = new Date(Date.UTC(currentYear, currentMonth, 1));
    viewDate.setUTCMonth(viewDate.getUTCMonth() + calendarMonthShift);
    const viewYear = viewDate.getUTCFullYear();
    const viewMonth = viewDate.getUTCMonth();
    const highlightedDay = (viewYear === currentYear && viewMonth === currentMonth) ? currentDay : null;
    const calendarKey = `${viewYear}-${viewMonth}-${highlightedDay ?? 'none'}`;

    if (calendarKey === lastCalendarKey) return;
    lastCalendarKey = calendarKey;

    const monthName = viewDate.toLocaleDateString('en-US', {
      month: 'long',
      timeZone: 'UTC'
    });
    monthEl.textContent = `${monthName.toUpperCase()} ${viewYear}`;

    const firstWeekdayIndex = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

    gridEl.innerHTML = '';

    for (let i = 0; i < firstWeekdayIndex; i += 1) {
      const emptyCell = document.createElement('span');
      emptyCell.className = 'clock-calendar-day is-empty';
      emptyCell.textContent = '';
      emptyCell.setAttribute('aria-hidden', 'true');
      gridEl.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayCell = document.createElement('span');
      dayCell.className = 'clock-calendar-day';
      dayCell.textContent = String(day);
      if (highlightedDay !== null && day === highlightedDay) {
        dayCell.classList.add('is-today');
        dayCell.setAttribute('aria-current', 'date');
      }
      gridEl.appendChild(dayCell);
    }
  };

  const getClosestOffset = (targetOffsetMinutes) => {
    const safeTarget = Number.isFinite(targetOffsetMinutes) ? targetOffsetMinutes : DEFAULT_OFFSET_MINUTES;
    return OFFSET_OPTIONS.reduce((closest, option) => (
      Math.abs(option - safeTarget) < Math.abs(closest - safeTarget) ? option : closest
    ), OFFSET_OPTIONS[0]);
  };

  const getOffsetIndex = () => {
    const index = OFFSET_OPTIONS.indexOf(utcOffsetMinutes);
    if (index >= 0) return index;

    const closest = getClosestOffset(utcOffsetMinutes);
    return OFFSET_OPTIONS.indexOf(closest);
  };

  const saveOffset = async () => {
    await StorageModule.setItem(STORAGE_KEY, utcOffsetMinutes, { syncCloud: false });
  };

  const setOffset = async (nextOffsetMinutes) => {
    const sanitized = sanitizeOffset(nextOffsetMinutes);
    if (sanitized === utcOffsetMinutes) {
      updateClock();
      return;
    }

    utcOffsetMinutes = sanitized;
    updateClock();
    await saveOffset();
  };

  const stepOffset = async (step) => {
    const direction = step >= 0 ? 1 : -1;
    const currentIndex = getOffsetIndex();
    const optionsLength = OFFSET_OPTIONS.length;
    const nextIndex = (currentIndex + direction + optionsLength) % optionsLength;
    await setOffset(OFFSET_OPTIONS[nextIndex]);
  };

  const stepCalendarMonth = (step) => {
    const direction = step >= 0 ? 1 : -1;
    calendarMonthShift += direction;
    lastCalendarKey = '';
    updateClock();
  };

  const updateClock = () => {
    const clockEl = document.getElementById('headerClock');
    const panelTimeEl = document.getElementById('clockPanelTime');
    const panelDateEl = document.getElementById('clockPanelDate');
    const panelTimezoneValue = document.getElementById('clockTimezoneValue');

    const now = new Date();
    if (clockEl) {
      clockEl.textContent = formatHeaderTime(now, utcOffsetMinutes);
      clockEl.setAttribute('data-iso', now.toISOString());
    }

    if (panelTimeEl) {
      panelTimeEl.textContent = formatUtcTime(now, utcOffsetMinutes);
    }
    if (panelDateEl) {
      panelDateEl.textContent = formatUtcDate(now, utcOffsetMinutes);
    }
    if (panelTimezoneValue) {
      panelTimezoneValue.textContent = formatOffsetLabel(utcOffsetMinutes);
    }
    renderCalendar(now, utcOffsetMinutes);
  };

  const setPanelOpen = (nextOpen) => {
    const panel = document.getElementById('clockPanel');
    const backdrop = document.getElementById('clockPanelBackdrop');
    const toggle = document.getElementById('headerClock');
    if (!panel || !backdrop || !toggle) return;

    panelOpen = nextOpen;
    panel.hidden = !nextOpen;
    backdrop.hidden = !nextOpen;
    toggle.setAttribute('aria-expanded', String(nextOpen));

    if (nextOpen) {
      calendarMonthShift = 0;
      lastCalendarKey = '';
      updateClock();
      document.getElementById('clockPanelCloseBtn')?.focus();
    } else {
      toggle.focus();
    }
  };

  const bindEvents = () => {
    const toggle = document.getElementById('headerClock');
    const closeBtn = document.getElementById('clockPanelCloseBtn');
    const backdrop = document.getElementById('clockPanelBackdrop');
    const offsetPrevBtn = document.getElementById('clockOffsetPrevBtn');
    const offsetNextBtn = document.getElementById('clockOffsetNextBtn');
    const localBtn = document.getElementById('clockUseLocalBtn');
    const calendarPrevBtn = document.getElementById('clockCalendarPrevBtn');
    const calendarNextBtn = document.getElementById('clockCalendarNextBtn');
    if (!toggle || !closeBtn || !backdrop || !offsetPrevBtn || !offsetNextBtn || !localBtn || !calendarPrevBtn || !calendarNextBtn) return;

    toggle.addEventListener('click', () => {
      setPanelOpen(!panelOpen);
    });
    closeBtn.addEventListener('click', () => {
      setPanelOpen(false);
    });
    backdrop.addEventListener('click', () => {
      setPanelOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && panelOpen) {
        setPanelOpen(false);
      }
    });

    offsetPrevBtn.addEventListener('click', () => {
      void stepOffset(-1);
    });
    offsetNextBtn.addEventListener('click', () => {
      void stepOffset(1);
    });
    localBtn.addEventListener('click', () => {
      const localOffsetMinutes = -new Date().getTimezoneOffset();
      const nearestSupportedOffset = getClosestOffset(localOffsetMinutes);
      void setOffset(nearestSupportedOffset);
    });
    calendarPrevBtn.addEventListener('click', () => {
      stepCalendarMonth(-1);
    });
    calendarNextBtn.addEventListener('click', () => {
      stepCalendarMonth(1);
    });
  };

  const load = async () => {
    if (started) return;
    started = true;

    utcOffsetMinutes = getClosestOffset(sanitizeOffset(await StorageModule.getItem(STORAGE_KEY)));
    bindEvents();
    updateClock();
    secondIntervalId = window.setInterval(updateClock, 1000);
  };

  return {
    load
  };
})();


// FocusLockModule - Minimal distraction mode with click-to-access
const FocusLockModule = (() => {
  const STORAGE_KEY = 'focusLockEnabled';
  const AUTO_ACTIVATE_KEY = 'focusLockAutoActivate';
  const RELOCK_DELAY_MS = 30000; // 30 seconds
  let enabled = false;
  let autoActivate = true;
  let listenersBound = false;
  const relockTimers = new Map();

  const addAccessHints = () => {
    const panels = document.querySelectorAll('.notes-panel, .todo-panel, .analytics-panel, .tag-reports-panel, .heatmap-panel');
    panels.forEach(panel => {
      if (panel.querySelector('.focus-lock-hint')) return;
      
      const hint = document.createElement('div');
      hint.className = 'focus-lock-hint';
      hint.textContent = 'Click to access';
      hint.setAttribute('aria-hidden', 'true');
      panel.appendChild(hint);
    });
  };

  const removeAccessHints = () => {
    document.querySelectorAll('.focus-lock-hint').forEach(hint => hint.remove());
  };

  const unlockPanel = (panel) => {
    if (!enabled) return;
    
    panel.classList.add('focus-lock-unlocked');
    
    // Clear existing relock timer
    if (relockTimers.has(panel)) {
      clearTimeout(relockTimers.get(panel));
    }
    
    // Set new relock timer
    const timer = setTimeout(() => {
      panel.classList.remove('focus-lock-unlocked');
      relockTimers.delete(panel);
    }, RELOCK_DELAY_MS);
    
    relockTimers.set(panel, timer);
  };

  const relockAllPanels = () => {
    relockTimers.forEach(timer => clearTimeout(timer));
    relockTimers.clear();
    document.querySelectorAll('.focus-lock-unlocked').forEach(panel => {
      panel.classList.remove('focus-lock-unlocked');
    });
  };

  const updateToggleButton = () => {
    const toggle = document.getElementById('focusLockToggle');
    if (!toggle) return;
    
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'Focus: On' : 'Focus Lock';
  };

  const setFocusLock = async (nextEnabled) => {
    if (enabled === nextEnabled) return;
    
    enabled = nextEnabled;
    document.body.classList.toggle('focus-lock-active', enabled);
    
    if (enabled) {
      addAccessHints();
    } else {
      removeAccessHints();
      relockAllPanels();
    }
    
    updateToggleButton();
    await StorageModule.setItem(STORAGE_KEY, enabled);
  };

  const toggle = async () => {
    await setFocusLock(!enabled);
  };

  const handleTimerStateChange = (event) => {
    if (!autoActivate) return;
    
    const { paused } = event.detail;
    if (!paused && !enabled) {
      void setFocusLock(true); // Timer started, enable focus lock
    } else if (paused && enabled) {
      void setFocusLock(false); // Timer paused, disable focus lock
    }
  };

  const handlePanelClick = (event) => {
    if (!enabled) return;
    
    const panel = event.currentTarget;
    unlockPanel(panel);
  };

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape' && enabled) {
      void setFocusLock(false);
    }
  };

  const bindEvents = () => {
    if (listenersBound) return;
    
    // Toggle button
    document.getElementById('focusLockToggle')?.addEventListener('click', toggle);
    
    // Panel click handlers
    const panels = document.querySelectorAll('.notes-panel, .todo-panel, .analytics-panel, .tag-reports-panel, .heatmap-panel');
    panels.forEach(panel => {
      panel.addEventListener('click', handlePanelClick);
    });
    
    // Timer state change listener
    document.addEventListener('timer:statechange', handleTimerStateChange);
    
    // Escape key listener
    document.addEventListener('keydown', handleEscapeKey);
    
    listenersBound = true;
  };

  const load = async () => {
    enabled = await StorageModule.getItem(STORAGE_KEY) || false;
    autoActivate = await StorageModule.getItem(AUTO_ACTIVATE_KEY) ?? true;
    
    if (enabled) {
      document.body.classList.add('focus-lock-active');
      addAccessHints();
    }
    
    bindEvents();
    updateToggleButton();
  };

  return {
    load,
    toggle,
    isEnabled: () => enabled
  };
})();


// Main Application Initialization
window.addEventListener('DOMContentLoaded', async () => {
  // Wait for Supabase to initialize (loads config from env vars in production)
  await supabasePromise;
  
  document.addEventListener('timer:statechange', syncTimerUIState);

  // Initialize theme
  await ThemeModule.load();

  // Run one-time data migration to Supabase
  await MigrationModule.runMigration();

  // Initialize header clock
  await ClockModule.load();

  // Initialize tags and active timer tag
  await TagsModule.load();
  
  // Initialize timer
  await TimerModule.loadState();

  // Initialize presets
  await PresetModule.load();

  // Initialize to-do list
  await ToDoModule.load();

  // Initialize notes panel
  await NotesModule.load();

  // Initialize settings panel and shortcut system
  SettingsPanelModule.init();
  DailyReportModule.init();
  ResetConfirmModule.init();
  await ShortcutModule.load();

  // Initialize streak and weekly goals
  await GoalsModule.load();

  // Initialize backup import/export controls
  BackupModule.load();
  
  // Initialize analytics
  await AnalyticsModule.showAnalytics();

  // Initialize consistency heatmap
  await HeatmapModule.load();

  // Initialize tag-based reports
  await TagReportsModule.load();

  // Initialize focus lock mode
  await FocusLockModule.load();
  
  // Attach event listeners to control buttons
  document.getElementById('startBtn').addEventListener('click', () => TimerModule.start());
  document.getElementById('pauseBtn').addEventListener('click', async () => {
    await TimerModule.pause();
    syncTimerUIState();
  });
  document.getElementById('resetBtn').addEventListener('click', async () => {
    await requestAndResetTimer();
  });
  document.getElementById('setHoursBtn').addEventListener('click', async () => {
    await TimerModule.setCustomHours();
    syncTimerUIState();
  });
  document.getElementById('themeToggle').addEventListener('click', async () => ThemeModule.toggle());

  syncTimerUIState();
});

const handlePageExit = () => {
  TimerModule.persistOnExit();
};

window.addEventListener('pagehide', handlePageExit);
window.addEventListener('beforeunload', handlePageExit);
