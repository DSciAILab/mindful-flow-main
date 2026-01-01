export interface ParsedTask {
  id: string;
  title: string;
  project_id: string | null;
  project: string | null;
  hashtags: string[];
  priority: 'low' | 'medium' | 'high' | null;
  type: 'task' | 'habit' | 'note';
  status: 'todo' | 'done_today' | 'completed' | 'project' | 'review' | 'cancelled' | null;
  description: string | null;
  due_date: string | null;
  category: 'red' | 'yellow' | 'purple' | 'green' | null;
  created_at?: string;
  updated_at?: string;
}

export function parseTaskInput(input: string): ParsedTask {
  let rawInput = input.trim();
  let tempTitleForExtraction = rawInput;
  let project_name: string | null = null;
  const hashtags: string[] = [];
  let type: ParsedTask['type'] = 'task';
  let priority: ParsedTask['priority'] = null;
  let status: ParsedTask['status'] = 'todo';
  let due_date: string | null = null;
  let category: ParsedTask['category'] = null;

  const noteRegex = /^:\s+/;
  if (noteRegex.test(tempTitleForExtraction)) {
    type = 'note';
    tempTitleForExtraction = tempTitleForExtraction.replace(noteRegex, '').trim();
    status = null;
  } else if (tempTitleForExtraction.startsWith('--')) {
    type = 'habit';
    tempTitleForExtraction = tempTitleForExtraction.substring(2).trim();
  } else if (tempTitleForExtraction.startsWith('-')) {
    type = 'task';
    tempTitleForExtraction = tempTitleForExtraction.substring(1).trim();
  }

  if (type === 'task') {
    const categoryRegex = /\s\/([RYPG])$/i;
    const categoryMatch = tempTitleForExtraction.match(categoryRegex);
    if (categoryMatch) {
      const categoryChar = categoryMatch[1].toUpperCase();
      if (categoryChar === 'R') category = 'red';
      else if (categoryChar === 'Y') category = 'yellow';
      else if (categoryChar === 'P') category = 'purple';
      else if (categoryChar === 'G') category = 'green';
      tempTitleForExtraction = tempTitleForExtraction.replace(categoryRegex, '').trim();
    }
  }

  if (type === 'task') {
    const dateRegex = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/;
    const dateMatch = tempTitleForExtraction.match(dateRegex);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) {
        year = `20${year}`;
      }
      due_date = `${year}-${month}-${day}`;
      tempTitleForExtraction = tempTitleForExtraction.replace(dateRegex, '').trim();
    }
  }

  if (type === 'task') {
    const priorityRegex = /\/([1-3])$/;
    const priorityMatch = tempTitleForExtraction.match(priorityRegex);
    if (priorityMatch) {
      const priorityNumber = priorityMatch[1];
      if (priorityNumber === '1') priority = 'low';
      else if (priorityNumber === '2') priority = 'medium';
      else if (priorityNumber === '3') priority = 'high';
      tempTitleForExtraction = tempTitleForExtraction.replace(priorityRegex, '').trim();
    }
  }

  const projectRegex = /@([^\s#]+(?:\s[^\s#]+)*)/g;
  const projectMatches = [...tempTitleForExtraction.matchAll(projectRegex)];
  if (projectMatches.length > 0) {
    const lastProjectMatch = projectMatches[projectMatches.length - 1];
    project_name = lastProjectMatch[1].trim();
    tempTitleForExtraction = tempTitleForExtraction.replace(lastProjectMatch[0], '').trim();
  }

  const hashtagRegex = /#([^\s#@]+)/g;
  const hashtagMatches = [...tempTitleForExtraction.matchAll(hashtagRegex)];
  if (hashtagMatches.length > 0) {
    hashtagMatches.forEach((match) => {
      hashtags.push(match[1].trim());
      tempTitleForExtraction = tempTitleForExtraction.replace(match[0], '').trim();
    });
  }

  let finalTitle = tempTitleForExtraction.trim();
  if (!finalTitle) {
    finalTitle =
      project_name ||
      hashtags[0] ||
      (rawInput.startsWith('--')
        ? rawInput.substring(2).trim()
        : rawInput.startsWith('-')
        ? rawInput.substring(1).trim()
        : rawInput);
  }

  return {
    id: Math.random().toString(36).substring(2, 15),
    title: finalTitle,
    project_id: null,
    project: project_name,
    hashtags,
    priority,
    type,
    status,
    description: null,
    due_date,
    category,
  };
}