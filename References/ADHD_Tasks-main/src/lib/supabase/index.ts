import * as tasks from './tasks';
import * as habits from './habits';
import * as profiles from './profiles';
import * as notes from './notes';
import * as quotes from './quotes';
import * as reviews from './reviews';
import * as moods from './moods';
import * as time from './time';
import * as scheduledBlocks from './scheduledBlocks';
import * as projects from './projects';
import * as thoughts from './thoughts'; // NEW IMPORT

export const supabaseDb = {
  ...tasks,
  ...habits,
  ...profiles,
  ...notes,
  ...quotes,
  ...reviews,
  ...moods,
  ...time,
  ...scheduledBlocks,
  ...projects,
  ...thoughts, // NEW EXPORT
};