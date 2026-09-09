-- Jobvair Assess: seed content for the prebuilt assessment library.
--
-- Real (not placeholder) content for the 13 assessments that ship in V1.
-- "Legal / Job Knowledge" is intentionally left as a draft assessment with
-- no seeded questions — per the product spec it's position-specific and
-- meant to be authored later via the admin question-bank tooling, not a
-- generic prebuilt test.
--
-- One section per assessment in this seed (the schema supports many —
-- this keeps V1 content manageable; more sections can be added later
-- without a schema change).
--
-- IDs are hand-assigned literals (not gen_random_uuid()) so this file can
-- insert assessments/sections/questions/options in one pass without
-- PL/pgSQL variables. Scheme: a0000000-... assessments, b0000000-...
-- sections, c0000000-... questions, d0000000-... options, e0000000-...
-- question banks. Safe to re-run (every insert is keyed by a fixed id).

-- ── Question banks (one per assessment) ───────────────────────────────────
insert into public.question_banks (id, name, category, skill) values
  ('e0000001-0000-0000-0000-000000000000', 'Typing',                  'Core Skills',      'Typing'),
  ('e0000002-0000-0000-0000-000000000000', 'Data Entry',              'Core Skills',      'Data Entry'),
  ('e0000003-0000-0000-0000-000000000000', 'Microsoft Excel',         'Microsoft Office', 'Excel'),
  ('e0000004-0000-0000-0000-000000000000', 'Microsoft Word',          'Microsoft Office', 'Word'),
  ('e0000005-0000-0000-0000-000000000000', 'Microsoft PowerPoint',    'Microsoft Office', 'PowerPoint'),
  ('e0000006-0000-0000-0000-000000000000', 'Reading Comprehension',   'Communication',    'Reading'),
  ('e0000007-0000-0000-0000-000000000000', 'Grammar and Spelling',    'Communication',    'Grammar'),
  ('e0000008-0000-0000-0000-000000000000', 'Written Communication',   'Communication',    'Writing'),
  ('e0000009-0000-0000-0000-000000000000', 'Data Analysis',           'Analytical',       'Data Analysis'),
  ('e000000a-0000-0000-0000-000000000000', 'Administrative Skills',   'Professional',     'Admin'),
  ('e000000b-0000-0000-0000-000000000000', 'Workplace Competencies',  'Professional',     'Judgment'),
  ('e000000c-0000-0000-0000-000000000000', 'AI Literacy',             'Technology',       'AI Literacy'),
  ('e000000e-0000-0000-0000-000000000000', 'IT Support Fundamentals', 'Technology',       'IT Support')
on conflict (id) do nothing;

-- ── Assessments ────────────────────────────────────────────────────────────
insert into public.assessments (id, slug, name, category, description, status, estimated_minutes, passing_score, scoring_method, instructions) values
  ('a0000001-0000-0000-0000-000000000000', 'typing',          'Typing',                    'Core Skills',      'Measures words per minute, accuracy, and consistency.',              'published', 10, 70, 'deterministic', 'Type the passage shown exactly as it appears, as quickly and accurately as you can.'),
  ('a0000002-0000-0000-0000-000000000000', 'data-entry',      'Data Entry',                'Core Skills',      'Tests speed and accuracy entering structured records.',              'published', 15, 70, 'deterministic', 'Enter each record into the matching fields exactly as shown.'),
  ('a0000003-0000-0000-0000-000000000000', 'excel',           'Microsoft Excel',           'Microsoft Office', 'Covers formulas, functions, and data analysis features.',            'published', 25, 70, 'deterministic', 'Choose the single best answer for each question.'),
  ('a0000004-0000-0000-0000-000000000000', 'word',            'Microsoft Word',            'Microsoft Office', 'Tests document formatting, styles, and production features.',        'published', 20, 70, 'deterministic', 'Choose the single best answer for each question.'),
  ('a0000005-0000-0000-0000-000000000000', 'powerpoint',      'Microsoft PowerPoint',      'Microsoft Office', 'Assesses slide design, animation, and delivery features.',           'published', 20, 70, 'deterministic', 'Choose the single best answer for each question.'),
  ('a0000006-0000-0000-0000-000000000000', 'reading',         'Reading Comprehension',     'Communication',    'Evaluates understanding of written professional content.',           'published', 20, 70, 'deterministic', 'Read the passage, then answer the questions about it.'),
  ('a0000007-0000-0000-0000-000000000000', 'grammar',         'Grammar and Spelling',      'Communication',    'Tests grammar, punctuation, and spelling in context.',                'published', 15, 70, 'deterministic', 'Choose the single best answer for each question.'),
  ('a0000008-0000-0000-0000-000000000000', 'writing',         'Written Communication',     'Communication',    'AI-scored workplace writing scenario.',                               'published', 20, 70, 'ai_rubric',     'Read the scenario and write a professional response.'),
  ('a0000009-0000-0000-0000-000000000000', 'data-analysis',   'Data Analysis',             'Analytical',       'Presents a dataset and business scenario requiring interpretation.', 'published', 25, 70, 'deterministic', 'Use the table provided to answer each question.'),
  ('a000000a-0000-0000-0000-000000000000', 'admin',           'Administrative Skills',     'Professional',     'Covers scheduling, correspondence, and office procedures.',          'published', 20, 70, 'deterministic', 'Choose the single best answer for each question.'),
  ('a000000b-0000-0000-0000-000000000000', 'workplace',       'Workplace Competencies',    'Professional',     'Situational judgment covering teamwork and professional conduct.',   'published', 20, 70, 'deterministic', 'Choose the single best response for each scenario.'),
  ('a000000c-0000-0000-0000-000000000000', 'ai-literacy',     'AI Literacy',               'Technology',       'Assesses understanding of AI tools, limitations, and responsible use.', 'published', 15, 70, 'deterministic', 'Choose the single best answer for each question.'),
  ('a000000d-0000-0000-0000-000000000000', 'legal-knowledge', 'Legal / Job Knowledge',     'Specialized',      'Position-specific legal/regulatory knowledge — configured per role.', 'draft',     25, 70, 'deterministic', null),
  ('a000000e-0000-0000-0000-000000000000', 'it-support',      'IT Support Fundamentals',   'Technology',       'Tests troubleshooting and customer support fundamentals.',           'published', 20, 70, 'deterministic', 'Choose the single best answer for each question.')
on conflict (id) do nothing;

-- ── Sections (one per assessment for V1) ──────────────────────────────────
insert into public.assessment_sections (id, assessment_id, name, display_order, weight) values
  ('b0000001-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000000', 'Typing Passage',           0, 1),
  ('b0000002-0000-0000-0000-000000000000', 'a0000002-0000-0000-0000-000000000000', 'Data Entry Records',       0, 1),
  ('b0000003-0000-0000-0000-000000000000', 'a0000003-0000-0000-0000-000000000000', 'Excel Fundamentals',       0, 1),
  ('b0000004-0000-0000-0000-000000000000', 'a0000004-0000-0000-0000-000000000000', 'Word Fundamentals',        0, 1),
  ('b0000005-0000-0000-0000-000000000000', 'a0000005-0000-0000-0000-000000000000', 'PowerPoint Fundamentals',  0, 1),
  ('b0000006-0000-0000-0000-000000000000', 'a0000006-0000-0000-0000-000000000000', 'Reading Passage',          0, 1),
  ('b0000007-0000-0000-0000-000000000000', 'a0000007-0000-0000-0000-000000000000', 'Grammar and Spelling',     0, 1),
  ('b0000008-0000-0000-0000-000000000000', 'a0000008-0000-0000-0000-000000000000', 'Writing Scenario',         0, 1),
  ('b0000009-0000-0000-0000-000000000000', 'a0000009-0000-0000-0000-000000000000', 'Quarterly Sales Dataset',  0, 1),
  ('b000000a-0000-0000-0000-000000000000', 'a000000a-0000-0000-0000-000000000000', 'Administrative Scenarios', 0, 1),
  ('b000000b-0000-0000-0000-000000000000', 'a000000b-0000-0000-0000-000000000000', 'Workplace Scenarios',      0, 1),
  ('b000000c-0000-0000-0000-000000000000', 'a000000c-0000-0000-0000-000000000000', 'AI Literacy',              0, 1),
  ('b000000e-0000-0000-0000-000000000000', 'a000000e-0000-0000-0000-000000000000', 'IT Support Scenarios',     0, 1)
on conflict (id) do nothing;

-- ── Typing (native exercise, no options) ──────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000101-0000-0000-0000-000000000000', 'e0000001-0000-0000-0000-000000000000', 'typing_exercise',
   'The ability to communicate effectively in a professional environment is essential for career success. Clear written communication helps teams collaborate, reduces misunderstandings, and demonstrates competence. Whether drafting emails, preparing reports, or responding to customers, strong writing skills create lasting positive impressions and drive organizational results.',
   100)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order) values
  ('b0000001-0000-0000-0000-000000000000', 'c0000101-0000-0000-0000-000000000000', 0)
on conflict do nothing;

-- ── Data Entry (native exercise, no options) ──────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points, correct_answer) values
  ('c0000201-0000-0000-0000-000000000000', 'e0000002-0000-0000-0000-000000000000', 'data_entry_exercise',
   'Enter each candidate record into the matching fields exactly as shown.',
   100,
   '{
     "fields": [
       {"key": "first_name", "label": "First Name"},
       {"key": "last_name", "label": "Last Name"},
       {"key": "dob", "label": "Date of Birth"},
       {"key": "phone", "label": "Phone"},
       {"key": "case_number", "label": "Case Number"}
     ],
     "records": [
       {"first_name": "Maria",   "last_name": "Gonzalez",   "dob": "1988-04-12", "phone": "555-201-3344", "case_number": "CN-88213"},
       {"first_name": "James",   "last_name": "Patterson",  "dob": "1975-11-02", "phone": "555-410-7788", "case_number": "CN-40021"},
       {"first_name": "Aisha",   "last_name": "Thompson",   "dob": "1990-07-23", "phone": "555-332-9012", "case_number": "CN-77410"},
       {"first_name": "Wei",     "last_name": "Chen",       "dob": "1982-01-30", "phone": "555-654-2201", "case_number": "CN-19833"},
       {"first_name": "Robert",  "last_name": "Alvarez",    "dob": "1969-09-15", "phone": "555-771-4420", "case_number": "CN-55210"},
       {"first_name": "Linda",   "last_name": "Kim",        "dob": "1995-03-08", "phone": "555-908-1123", "case_number": "CN-63302"},
       {"first_name": "Samuel",  "last_name": "Osei",       "dob": "1987-12-19", "phone": "555-223-6690", "case_number": "CN-28710"},
       {"first_name": "Priya",   "last_name": "Nair",       "dob": "1993-06-27", "phone": "555-509-8871", "case_number": "CN-91045"}
     ]
   }'::jsonb)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order) values
  ('b0000002-0000-0000-0000-000000000000', 'c0000201-0000-0000-0000-000000000000', 0)
on conflict do nothing;

-- ── Excel (8 MCQ) ──────────────────────────────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000301-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which Excel function adds all the numbers in a range of cells?', 1),
  ('c0000302-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which function returns the arithmetic mean (average) of a range of cells?', 1),
  ('c0000303-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'You want a formula to return one value if a condition is true and a different value if it is false. Which function should you use?', 1),
  ('c0000304-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which function counts the number of cells in a range that meet a single condition?', 1),
  ('c0000305-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which function is the modern replacement for VLOOKUP that can search in any direction?', 1),
  ('c0000306-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'You need to summarize thousands of rows of sales data by region and product without writing formulas. What feature should you use?', 1),
  ('c0000307-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which feature restricts what a user can type into a cell, such as only allowing dates within a range?', 1),
  ('c0000308-0000-0000-0000-000000000000', 'e0000003-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which feature temporarily hides rows that do not match certain criteria, without deleting any data?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000301-0000-0000-0000-000000000000', 'c0000301-0000-0000-0000-000000000000', 'SUM', 'SUM', true, 0),
  ('d0000302-0000-0000-0000-000000000000', 'c0000301-0000-0000-0000-000000000000', 'COUNT', 'COUNT', false, 1),
  ('d0000303-0000-0000-0000-000000000000', 'c0000301-0000-0000-0000-000000000000', 'AVERAGE', 'AVERAGE', false, 2),
  ('d0000304-0000-0000-0000-000000000000', 'c0000301-0000-0000-0000-000000000000', 'TOTAL', 'TOTAL', false, 3),

  ('d0000311-0000-0000-0000-000000000000', 'c0000302-0000-0000-0000-000000000000', 'SUM', 'SUM', false, 0),
  ('d0000312-0000-0000-0000-000000000000', 'c0000302-0000-0000-0000-000000000000', 'AVERAGE', 'AVERAGE', true, 1),
  ('d0000313-0000-0000-0000-000000000000', 'c0000302-0000-0000-0000-000000000000', 'MEDIAN', 'MEDIAN', false, 2),
  ('d0000314-0000-0000-0000-000000000000', 'c0000302-0000-0000-0000-000000000000', 'MODE', 'MODE', false, 3),

  ('d0000321-0000-0000-0000-000000000000', 'c0000303-0000-0000-0000-000000000000', 'IF', 'IF', true, 0),
  ('d0000322-0000-0000-0000-000000000000', 'c0000303-0000-0000-0000-000000000000', 'AND', 'AND', false, 1),
  ('d0000323-0000-0000-0000-000000000000', 'c0000303-0000-0000-0000-000000000000', 'OR', 'OR', false, 2),
  ('d0000324-0000-0000-0000-000000000000', 'c0000303-0000-0000-0000-000000000000', 'VLOOKUP', 'VLOOKUP', false, 3),

  ('d0000331-0000-0000-0000-000000000000', 'c0000304-0000-0000-0000-000000000000', 'COUNT', 'COUNT', false, 0),
  ('d0000332-0000-0000-0000-000000000000', 'c0000304-0000-0000-0000-000000000000', 'SUMIF', 'SUMIF', false, 1),
  ('d0000333-0000-0000-0000-000000000000', 'c0000304-0000-0000-0000-000000000000', 'COUNTIF', 'COUNTIF', true, 2),
  ('d0000334-0000-0000-0000-000000000000', 'c0000304-0000-0000-0000-000000000000', 'COUNTA', 'COUNTA', false, 3),

  ('d0000341-0000-0000-0000-000000000000', 'c0000305-0000-0000-0000-000000000000', 'HLOOKUP', 'HLOOKUP', false, 0),
  ('d0000342-0000-0000-0000-000000000000', 'c0000305-0000-0000-0000-000000000000', 'XLOOKUP', 'XLOOKUP', true, 1),
  ('d0000343-0000-0000-0000-000000000000', 'c0000305-0000-0000-0000-000000000000', 'INDEX', 'INDEX', false, 2),
  ('d0000344-0000-0000-0000-000000000000', 'c0000305-0000-0000-0000-000000000000', 'MATCH', 'MATCH', false, 3),

  ('d0000351-0000-0000-0000-000000000000', 'c0000306-0000-0000-0000-000000000000', 'Conditional Formatting', 'Conditional Formatting', false, 0),
  ('d0000352-0000-0000-0000-000000000000', 'c0000306-0000-0000-0000-000000000000', 'Data Validation', 'Data Validation', false, 1),
  ('d0000353-0000-0000-0000-000000000000', 'c0000306-0000-0000-0000-000000000000', 'PivotTable', 'PivotTable', true, 2),
  ('d0000354-0000-0000-0000-000000000000', 'c0000306-0000-0000-0000-000000000000', 'Freeze Panes', 'Freeze Panes', false, 3),

  ('d0000361-0000-0000-0000-000000000000', 'c0000307-0000-0000-0000-000000000000', 'Data Validation', 'Data Validation', true, 0),
  ('d0000362-0000-0000-0000-000000000000', 'c0000307-0000-0000-0000-000000000000', 'Conditional Formatting', 'Conditional Formatting', false, 1),
  ('d0000363-0000-0000-0000-000000000000', 'c0000307-0000-0000-0000-000000000000', 'Filter', 'Filter', false, 2),
  ('d0000364-0000-0000-0000-000000000000', 'c0000307-0000-0000-0000-000000000000', 'Protect Sheet', 'Protect Sheet', false, 3),

  ('d0000371-0000-0000-0000-000000000000', 'c0000308-0000-0000-0000-000000000000', 'Sort', 'Sort', false, 0),
  ('d0000372-0000-0000-0000-000000000000', 'c0000308-0000-0000-0000-000000000000', 'Filter', 'Filter', true, 1),
  ('d0000373-0000-0000-0000-000000000000', 'c0000308-0000-0000-0000-000000000000', 'Group', 'Group', false, 2),
  ('d0000374-0000-0000-0000-000000000000', 'c0000308-0000-0000-0000-000000000000', 'Freeze Panes', 'Freeze Panes', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b0000003-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000301-0000-0000-0000-000000000000','c0000302-0000-0000-0000-000000000000','c0000303-0000-0000-0000-000000000000','c0000304-0000-0000-0000-000000000000',
  'c0000305-0000-0000-0000-000000000000','c0000306-0000-0000-0000-000000000000','c0000307-0000-0000-0000-000000000000','c0000308-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── Word (6 MCQ) ───────────────────────────────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000401-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which Word feature automatically combines a form letter with a list of names and addresses to create personalized copies?', 1),
  ('c0000402-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which feature lets reviewers suggest edits that the original author can accept or reject?', 1),
  ('c0000403-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000', 'multiple_choice_single', 'What is the fastest way to apply consistent formatting to every heading in a long document?', 1),
  ('c0000404-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which feature automatically generates a Table of Contents from a document''s headings?', 1),
  ('c0000405-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000', 'multiple_choice_single', 'You need page numbers to restart at 1 partway through a document. What must you insert first?', 1),
  ('c0000406-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which view shows exactly how a document will look when printed, including margins and page breaks?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000401-0000-0000-0000-000000000000', 'c0000401-0000-0000-0000-000000000000', 'Mail Merge', 'Mail Merge', true, 0),
  ('d0000402-0000-0000-0000-000000000000', 'c0000401-0000-0000-0000-000000000000', 'Track Changes', 'Track Changes', false, 1),
  ('d0000403-0000-0000-0000-000000000000', 'c0000401-0000-0000-0000-000000000000', 'Quick Parts', 'Quick Parts', false, 2),
  ('d0000404-0000-0000-0000-000000000000', 'c0000401-0000-0000-0000-000000000000', 'AutoText', 'AutoText', false, 3),

  ('d0000411-0000-0000-0000-000000000000', 'c0000402-0000-0000-0000-000000000000', 'Comments', 'Comments', false, 0),
  ('d0000412-0000-0000-0000-000000000000', 'c0000402-0000-0000-0000-000000000000', 'Track Changes', 'Track Changes', true, 1),
  ('d0000413-0000-0000-0000-000000000000', 'c0000402-0000-0000-0000-000000000000', 'Compare', 'Compare', false, 2),
  ('d0000414-0000-0000-0000-000000000000', 'c0000402-0000-0000-0000-000000000000', 'Styles', 'Styles', false, 3),

  ('d0000421-0000-0000-0000-000000000000', 'c0000403-0000-0000-0000-000000000000', 'Manually format each heading', 'Manually format each heading', false, 0),
  ('d0000422-0000-0000-0000-000000000000', 'c0000403-0000-0000-0000-000000000000', 'Use Styles', 'Use Styles', true, 1),
  ('d0000423-0000-0000-0000-000000000000', 'c0000403-0000-0000-0000-000000000000', 'Use Find & Replace', 'Use Find & Replace', false, 2),
  ('d0000424-0000-0000-0000-000000000000', 'c0000403-0000-0000-0000-000000000000', 'Use Mail Merge', 'Use Mail Merge', false, 3),

  ('d0000431-0000-0000-0000-000000000000', 'c0000404-0000-0000-0000-000000000000', 'Index', 'Index', false, 0),
  ('d0000432-0000-0000-0000-000000000000', 'c0000404-0000-0000-0000-000000000000', 'Bookmarks', 'Bookmarks', false, 1),
  ('d0000433-0000-0000-0000-000000000000', 'c0000404-0000-0000-0000-000000000000', 'Table of Contents tool', 'Table of Contents tool', true, 2),
  ('d0000434-0000-0000-0000-000000000000', 'c0000404-0000-0000-0000-000000000000', 'Cross-reference', 'Cross-reference', false, 3),

  ('d0000441-0000-0000-0000-000000000000', 'c0000405-0000-0000-0000-000000000000', 'A page break', 'A page break', false, 0),
  ('d0000442-0000-0000-0000-000000000000', 'c0000405-0000-0000-0000-000000000000', 'A section break', 'A section break', true, 1),
  ('d0000443-0000-0000-0000-000000000000', 'c0000405-0000-0000-0000-000000000000', 'A column break', 'A column break', false, 2),
  ('d0000444-0000-0000-0000-000000000000', 'c0000405-0000-0000-0000-000000000000', 'A line break', 'A line break', false, 3),

  ('d0000451-0000-0000-0000-000000000000', 'c0000406-0000-0000-0000-000000000000', 'Draft view', 'Draft view', false, 0),
  ('d0000452-0000-0000-0000-000000000000', 'c0000406-0000-0000-0000-000000000000', 'Outline view', 'Outline view', false, 1),
  ('d0000453-0000-0000-0000-000000000000', 'c0000406-0000-0000-0000-000000000000', 'Print Layout view', 'Print Layout view', true, 2),
  ('d0000454-0000-0000-0000-000000000000', 'c0000406-0000-0000-0000-000000000000', 'Web Layout view', 'Web Layout view', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b0000004-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000401-0000-0000-0000-000000000000','c0000402-0000-0000-0000-000000000000','c0000403-0000-0000-0000-000000000000',
  'c0000404-0000-0000-0000-000000000000','c0000405-0000-0000-0000-000000000000','c0000406-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── PowerPoint (5 MCQ) ─────────────────────────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000501-0000-0000-0000-000000000000', 'e0000005-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which feature lets you apply a consistent look (fonts, colors, layout) across every slide in a presentation?', 1),
  ('c0000502-0000-0000-0000-000000000000', 'e0000005-0000-0000-0000-000000000000', 'multiple_choice_single', 'What is the difference between a transition and an animation in PowerPoint?', 1),
  ('c0000503-0000-0000-0000-000000000000', 'e0000005-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which view lets you rearrange the order of slides by dragging thumbnails?', 1),
  ('c0000504-0000-0000-0000-000000000000', 'e0000005-0000-0000-0000-000000000000', 'multiple_choice_single', 'You are presenting to a room and want your speaker notes visible only to you while the audience sees only the slide. Which feature should you use?', 1),
  ('c0000505-0000-0000-0000-000000000000', 'e0000005-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which of these is generally best practice for a professional, easy-to-read slide?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000501-0000-0000-0000-000000000000', 'c0000501-0000-0000-0000-000000000000', 'Slide Master', 'Slide Master', true, 0),
  ('d0000502-0000-0000-0000-000000000000', 'c0000501-0000-0000-0000-000000000000', 'Slide Sorter', 'Slide Sorter', false, 1),
  ('d0000503-0000-0000-0000-000000000000', 'c0000501-0000-0000-0000-000000000000', 'Animations', 'Animations', false, 2),
  ('d0000504-0000-0000-0000-000000000000', 'c0000501-0000-0000-0000-000000000000', 'Transitions', 'Transitions', false, 3),

  ('d0000511-0000-0000-0000-000000000000', 'c0000502-0000-0000-0000-000000000000', 'They are the same thing', 'same', false, 0),
  ('d0000512-0000-0000-0000-000000000000', 'c0000502-0000-0000-0000-000000000000', 'Transitions apply between slides; animations apply to objects within a slide', 'correct', true, 1),
  ('d0000513-0000-0000-0000-000000000000', 'c0000502-0000-0000-0000-000000000000', 'Transitions apply to text only', 'text-only', false, 2),
  ('d0000514-0000-0000-0000-000000000000', 'c0000502-0000-0000-0000-000000000000', 'Animations only work with video', 'video-only', false, 3),

  ('d0000521-0000-0000-0000-000000000000', 'c0000503-0000-0000-0000-000000000000', 'Slide Sorter view', 'Slide Sorter view', true, 0),
  ('d0000522-0000-0000-0000-000000000000', 'c0000503-0000-0000-0000-000000000000', 'Notes Page view', 'Notes Page view', false, 1),
  ('d0000523-0000-0000-0000-000000000000', 'c0000503-0000-0000-0000-000000000000', 'Reading view', 'Reading view', false, 2),
  ('d0000524-0000-0000-0000-000000000000', 'c0000503-0000-0000-0000-000000000000', 'Outline view', 'Outline view', false, 3),

  ('d0000531-0000-0000-0000-000000000000', 'c0000504-0000-0000-0000-000000000000', 'Presenter View', 'Presenter View', true, 0),
  ('d0000532-0000-0000-0000-000000000000', 'c0000504-0000-0000-0000-000000000000', 'Slide Show view', 'Slide Show view', false, 1),
  ('d0000533-0000-0000-0000-000000000000', 'c0000504-0000-0000-0000-000000000000', 'Rehearse Timings', 'Rehearse Timings', false, 2),
  ('d0000534-0000-0000-0000-000000000000', 'c0000504-0000-0000-0000-000000000000', 'Record Slide Show', 'Record Slide Show', false, 3),

  ('d0000541-0000-0000-0000-000000000000', 'c0000505-0000-0000-0000-000000000000', 'Use as much text as possible', 'max-text', false, 0),
  ('d0000542-0000-0000-0000-000000000000', 'c0000505-0000-0000-0000-000000000000', 'Use a different font on every slide', 'diff-fonts', false, 1),
  ('d0000543-0000-0000-0000-000000000000', 'c0000505-0000-0000-0000-000000000000', 'Use large, minimal text with a clear visual hierarchy', 'minimal', true, 2),
  ('d0000544-0000-0000-0000-000000000000', 'c0000505-0000-0000-0000-000000000000', 'Use full paragraphs on each slide', 'paragraphs', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b0000005-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000501-0000-0000-0000-000000000000','c0000502-0000-0000-0000-000000000000','c0000503-0000-0000-0000-000000000000',
  'c0000504-0000-0000-0000-000000000000','c0000505-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── Reading Comprehension (1 passage repeated in 4 questions, 4 MCQ) ──────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000601-0000-0000-0000-000000000000', 'e0000006-0000-0000-0000-000000000000', 'multiple_choice_single',
   E'Passage: Effective onboarding is one of the strongest predictors of long-term employee retention. Organizations that invest in a structured first 90 days—covering role expectations, required training, and regular check-ins with a manager—see significantly lower turnover than those that leave new hires to learn informally. However, structure alone is not enough: employees consistently report that feeling welcomed by their team and understanding how their work connects to larger organizational goals matters just as much as procedural training.\n\nQuestion: According to the passage, what is one of the strongest predictors of long-term employee retention?', 1),
  ('c0000602-0000-0000-0000-000000000000', 'e0000006-0000-0000-0000-000000000000', 'multiple_choice_single',
   E'Passage: Effective onboarding is one of the strongest predictors of long-term employee retention. Organizations that invest in a structured first 90 days—covering role expectations, required training, and regular check-ins with a manager—see significantly lower turnover than those that leave new hires to learn informally. However, structure alone is not enough: employees consistently report that feeling welcomed by their team and understanding how their work connects to larger organizational goals matters just as much as procedural training.\n\nQuestion: Based on the passage, what tends to happen at organizations that leave new hires to learn informally?', 1),
  ('c0000603-0000-0000-0000-000000000000', 'e0000006-0000-0000-0000-000000000000', 'multiple_choice_single',
   E'Passage: Effective onboarding is one of the strongest predictors of long-term employee retention. Organizations that invest in a structured first 90 days—covering role expectations, required training, and regular check-ins with a manager—see significantly lower turnover than those that leave new hires to learn informally. However, structure alone is not enough: employees consistently report that feeling welcomed by their team and understanding how their work connects to larger organizational goals matters just as much as procedural training.\n\nQuestion: The passage suggests that structured onboarding alone is:', 1),
  ('c0000604-0000-0000-0000-000000000000', 'e0000006-0000-0000-0000-000000000000', 'multiple_choice_single',
   E'Passage: Effective onboarding is one of the strongest predictors of long-term employee retention. Organizations that invest in a structured first 90 days—covering role expectations, required training, and regular check-ins with a manager—see significantly lower turnover than those that leave new hires to learn informally. However, structure alone is not enough: employees consistently report that feeling welcomed by their team and understanding how their work connects to larger organizational goals matters just as much as procedural training.\n\nQuestion: What two additional factors does the passage say matter as much as procedural training?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000601-0000-0000-0000-000000000000', 'c0000601-0000-0000-0000-000000000000', 'Salary', 'salary', false, 0),
  ('d0000602-0000-0000-0000-000000000000', 'c0000601-0000-0000-0000-000000000000', 'Effective onboarding', 'onboarding', true, 1),
  ('d0000603-0000-0000-0000-000000000000', 'c0000601-0000-0000-0000-000000000000', 'Office location', 'location', false, 2),
  ('d0000604-0000-0000-0000-000000000000', 'c0000601-0000-0000-0000-000000000000', 'Company size', 'size', false, 3),

  ('d0000611-0000-0000-0000-000000000000', 'c0000602-0000-0000-0000-000000000000', 'They see significantly lower turnover', 'lower', false, 0),
  ('d0000612-0000-0000-0000-000000000000', 'c0000602-0000-0000-0000-000000000000', 'They see significantly higher turnover', 'higher', true, 1),
  ('d0000613-0000-0000-0000-000000000000', 'c0000602-0000-0000-0000-000000000000', 'Turnover is unaffected', 'unaffected', false, 2),
  ('d0000614-0000-0000-0000-000000000000', 'c0000602-0000-0000-0000-000000000000', 'The passage does not say', 'not-stated', false, 3),

  ('d0000621-0000-0000-0000-000000000000', 'c0000603-0000-0000-0000-000000000000', 'Sufficient by itself', 'sufficient', false, 0),
  ('d0000622-0000-0000-0000-000000000000', 'c0000603-0000-0000-0000-000000000000', 'Unnecessary', 'unnecessary', false, 1),
  ('d0000623-0000-0000-0000-000000000000', 'c0000603-0000-0000-0000-000000000000', 'Not enough on its own', 'not-enough', true, 2),
  ('d0000624-0000-0000-0000-000000000000', 'c0000603-0000-0000-0000-000000000000', 'The only factor that matters', 'only-factor', false, 3),

  ('d0000631-0000-0000-0000-000000000000', 'c0000604-0000-0000-0000-000000000000', 'Salary and benefits', 'salary-benefits', false, 0),
  ('d0000632-0000-0000-0000-000000000000', 'c0000604-0000-0000-0000-000000000000', 'Feeling welcomed by the team and understanding how work connects to organizational goals', 'welcomed-connected', true, 1),
  ('d0000633-0000-0000-0000-000000000000', 'c0000604-0000-0000-0000-000000000000', 'Office design and commute time', 'design-commute', false, 2),
  ('d0000634-0000-0000-0000-000000000000', 'c0000604-0000-0000-0000-000000000000', 'Company reputation and stock performance', 'reputation-stock', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b0000006-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000601-0000-0000-0000-000000000000','c0000602-0000-0000-0000-000000000000','c0000603-0000-0000-0000-000000000000','c0000604-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── Grammar and Spelling (8 MCQ) ───────────────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000701-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', 'Choose the correctly written sentence.', 1),
  ('c0000702-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', E'Which word is misspelled in this sentence?\n"The commitee will review the proposal tomorrow."', 1),
  ('c0000703-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', 'Choose the sentence with correct subject-verb agreement.', 1),
  ('c0000704-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', 'Choose the correctly punctuated sentence.', 1),
  ('c0000705-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which sentence uses the correct form of "their / there / they''re"?', 1),
  ('c0000706-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', E'Choose the best revision of this run-on sentence:\n"The report was late the manager was upset."', 1),
  ('c0000707-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', 'Identify the correctly capitalized sentence.', 1),
  ('c0000708-0000-0000-0000-000000000000', 'e0000007-0000-0000-0000-000000000000', 'multiple_choice_single', 'Choose the sentence with the correct word choice.', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000701-0000-0000-0000-000000000000', 'c0000701-0000-0000-0000-000000000000', 'Its important to submit the report on time.', 'a', false, 0),
  ('d0000702-0000-0000-0000-000000000000', 'c0000701-0000-0000-0000-000000000000', E'It''s important to submit the report on time.', 'b', true, 1),
  ('d0000703-0000-0000-0000-000000000000', 'c0000701-0000-0000-0000-000000000000', E'Its'' important to submit the report on time.', 'c', false, 2),
  ('d0000704-0000-0000-0000-000000000000', 'c0000701-0000-0000-0000-000000000000', 'Its important too submit the report on time.', 'd', false, 3),

  ('d0000711-0000-0000-0000-000000000000', 'c0000702-0000-0000-0000-000000000000', 'commitee', 'commitee', true, 0),
  ('d0000712-0000-0000-0000-000000000000', 'c0000702-0000-0000-0000-000000000000', 'review', 'review', false, 1),
  ('d0000713-0000-0000-0000-000000000000', 'c0000702-0000-0000-0000-000000000000', 'proposal', 'proposal', false, 2),
  ('d0000714-0000-0000-0000-000000000000', 'c0000702-0000-0000-0000-000000000000', 'tomorrow', 'tomorrow', false, 3),

  ('d0000721-0000-0000-0000-000000000000', 'c0000703-0000-0000-0000-000000000000', 'The list of items are on the desk.', 'a', false, 0),
  ('d0000722-0000-0000-0000-000000000000', 'c0000703-0000-0000-0000-000000000000', 'The list of items is on the desk.', 'b', true, 1),
  ('d0000723-0000-0000-0000-000000000000', 'c0000703-0000-0000-0000-000000000000', 'The list of items were on the desk.', 'c', false, 2),
  ('d0000724-0000-0000-0000-000000000000', 'c0000703-0000-0000-0000-000000000000', 'The list of item is on the desk.', 'd', false, 3),

  ('d0000731-0000-0000-0000-000000000000', 'c0000704-0000-0000-0000-000000000000', 'Please bring the following items, pens paper and folders.', 'a', false, 0),
  ('d0000732-0000-0000-0000-000000000000', 'c0000704-0000-0000-0000-000000000000', 'Please bring the following items: pens, paper, and folders.', 'b', true, 1),
  ('d0000733-0000-0000-0000-000000000000', 'c0000704-0000-0000-0000-000000000000', 'Please bring the following items pens, paper, and folders.', 'c', false, 2),
  ('d0000734-0000-0000-0000-000000000000', 'c0000704-0000-0000-0000-000000000000', 'Please bring the following items; pens, paper and folders.', 'd', false, 3),

  ('d0000741-0000-0000-0000-000000000000', 'c0000705-0000-0000-0000-000000000000', 'Their going to the meeting at noon.', 'a', false, 0),
  ('d0000742-0000-0000-0000-000000000000', 'c0000705-0000-0000-0000-000000000000', 'There going to the meeting at noon.', 'b', false, 1),
  ('d0000743-0000-0000-0000-000000000000', 'c0000705-0000-0000-0000-000000000000', E'They''re going to the meeting at noon.', 'c', true, 2),
  ('d0000744-0000-0000-0000-000000000000', 'c0000705-0000-0000-0000-000000000000', 'Their going too the meeting at noon.', 'd', false, 3),

  ('d0000751-0000-0000-0000-000000000000', 'c0000706-0000-0000-0000-000000000000', 'The report was late, the manager was upset.', 'a', false, 0),
  ('d0000752-0000-0000-0000-000000000000', 'c0000706-0000-0000-0000-000000000000', 'The report was late; the manager was upset.', 'b', true, 1),
  ('d0000753-0000-0000-0000-000000000000', 'c0000706-0000-0000-0000-000000000000', 'The report was late the manager, was upset.', 'c', false, 2),
  ('d0000754-0000-0000-0000-000000000000', 'c0000706-0000-0000-0000-000000000000', 'No change needed.', 'd', false, 3),

  ('d0000761-0000-0000-0000-000000000000', 'c0000707-0000-0000-0000-000000000000', 'We will meet the Director of human resources next Monday.', 'a', false, 0),
  ('d0000762-0000-0000-0000-000000000000', 'c0000707-0000-0000-0000-000000000000', 'We will meet the director of Human Resources next monday.', 'b', false, 1),
  ('d0000763-0000-0000-0000-000000000000', 'c0000707-0000-0000-0000-000000000000', 'We will meet the Director of Human Resources next Monday.', 'c', true, 2),
  ('d0000764-0000-0000-0000-000000000000', 'c0000707-0000-0000-0000-000000000000', 'we will meet the director of human resources next monday.', 'd', false, 3),

  ('d0000771-0000-0000-0000-000000000000', 'c0000708-0000-0000-0000-000000000000', 'The effect of the new policy was immediate.', 'a', true, 0),
  ('d0000772-0000-0000-0000-000000000000', 'c0000708-0000-0000-0000-000000000000', 'The affect of the new policy was immediate.', 'b', false, 1),
  ('d0000773-0000-0000-0000-000000000000', 'c0000708-0000-0000-0000-000000000000', 'The effects of the new policy was immediate.', 'c', false, 2),
  ('d0000774-0000-0000-0000-000000000000', 'c0000708-0000-0000-0000-000000000000', 'The affects of the new policy was immediate.', 'd', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b0000007-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000701-0000-0000-0000-000000000000','c0000702-0000-0000-0000-000000000000','c0000703-0000-0000-0000-000000000000','c0000704-0000-0000-0000-000000000000',
  'c0000705-0000-0000-0000-000000000000','c0000706-0000-0000-0000-000000000000','c0000707-0000-0000-0000-000000000000','c0000708-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── Written Communication (1 AI-rubric-scored scenario) ───────────────────
insert into public.questions (id, question_bank_id, type, prompt, points, rubric) values
  ('c0000801-0000-0000-0000-000000000000', 'e0000008-0000-0000-0000-000000000000', 'long_form_written',
   E'You receive the following email from a customer:\n\n"I ordered a replacement part two weeks ago and it still hasn\'t arrived. I\'ve called twice and no one has given me a straight answer. I need this resolved today or I\'m taking my business elsewhere."\n\nDraft a professional email response to this customer. Address their concern, use an appropriate tone, and propose a clear next step.',
   100,
   '{"criteria": ["grammar", "clarity", "professionalism", "completeness"], "scale": 100}'::jsonb)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order) values
  ('b0000008-0000-0000-0000-000000000000', 'c0000801-0000-0000-0000-000000000000', 0)
on conflict do nothing;

-- ── Data Analysis (small dataset, 4 MCQ) ──────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000901-0000-0000-0000-000000000000', 'e0000009-0000-0000-0000-000000000000', 'table_interpretation',
   E'Quarterly regional sales (in $ thousands):\n\nRegion | Q1  | Q2  | Q3  | Q4\nNorth  | 120 | 135 | 128 | 142\nSouth  | 98  | 101 | 110 | 105\nEast   | 150 | 149 | 160 | 158\nWest   | 87  | 92  | 95  | 99\n\nQuestion: Which region had the highest total sales across all four quarters?', 1),
  ('c0000902-0000-0000-0000-000000000000', 'e0000009-0000-0000-0000-000000000000', 'table_interpretation',
   E'Quarterly regional sales (in $ thousands):\n\nRegion | Q1  | Q2  | Q3  | Q4\nNorth  | 120 | 135 | 128 | 142\nSouth  | 98  | 101 | 110 | 105\nEast   | 150 | 149 | 160 | 158\nWest   | 87  | 92  | 95  | 99\n\nQuestion: Which region showed a decline in sales from Q1 to Q2?', 1),
  ('c0000903-0000-0000-0000-000000000000', 'e0000009-0000-0000-0000-000000000000', 'table_interpretation',
   E'Quarterly regional sales (in $ thousands):\n\nRegion | Q1  | Q2  | Q3  | Q4\nNorth  | 120 | 135 | 128 | 142\nSouth  | 98  | 101 | 110 | 105\nEast   | 150 | 149 | 160 | 158\nWest   | 87  | 92  | 95  | 99\n\nQuestion: What was the West region''s total sales across the year (in thousands)?', 1),
  ('c0000904-0000-0000-0000-000000000000', 'e0000009-0000-0000-0000-000000000000', 'table_interpretation',
   E'Quarterly regional sales (in $ thousands):\n\nRegion | Q1  | Q2  | Q3  | Q4\nNorth  | 120 | 135 | 128 | 142\nSouth  | 98  | 101 | 110 | 105\nEast   | 150 | 149 | 160 | 158\nWest   | 87  | 92  | 95  | 99\n\nQuestion: Which region had the most consistent (least variable) sales quarter to quarter?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000901-0000-0000-0000-000000000000', 'c0000901-0000-0000-0000-000000000000', 'North', 'North', false, 0),
  ('d0000902-0000-0000-0000-000000000000', 'c0000901-0000-0000-0000-000000000000', 'South', 'South', false, 1),
  ('d0000903-0000-0000-0000-000000000000', 'c0000901-0000-0000-0000-000000000000', 'East', 'East', true, 2),
  ('d0000904-0000-0000-0000-000000000000', 'c0000901-0000-0000-0000-000000000000', 'West', 'West', false, 3),

  ('d0000911-0000-0000-0000-000000000000', 'c0000902-0000-0000-0000-000000000000', 'North', 'North', false, 0),
  ('d0000912-0000-0000-0000-000000000000', 'c0000902-0000-0000-0000-000000000000', 'South', 'South', false, 1),
  ('d0000913-0000-0000-0000-000000000000', 'c0000902-0000-0000-0000-000000000000', 'East', 'East', true, 2),
  ('d0000914-0000-0000-0000-000000000000', 'c0000902-0000-0000-0000-000000000000', 'West', 'West', false, 3),

  ('d0000921-0000-0000-0000-000000000000', 'c0000903-0000-0000-0000-000000000000', '360', '360', false, 0),
  ('d0000922-0000-0000-0000-000000000000', 'c0000903-0000-0000-0000-000000000000', '373', '373', true, 1),
  ('d0000923-0000-0000-0000-000000000000', 'c0000903-0000-0000-0000-000000000000', '383', '383', false, 2),
  ('d0000924-0000-0000-0000-000000000000', 'c0000903-0000-0000-0000-000000000000', '395', '395', false, 3),

  ('d0000931-0000-0000-0000-000000000000', 'c0000904-0000-0000-0000-000000000000', 'North', 'North', false, 0),
  ('d0000932-0000-0000-0000-000000000000', 'c0000904-0000-0000-0000-000000000000', 'South', 'South', true, 1),
  ('d0000933-0000-0000-0000-000000000000', 'c0000904-0000-0000-0000-000000000000', 'East', 'East', false, 2),
  ('d0000934-0000-0000-0000-000000000000', 'c0000904-0000-0000-0000-000000000000', 'West', 'West', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b0000009-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000901-0000-0000-0000-000000000000','c0000902-0000-0000-0000-000000000000','c0000903-0000-0000-0000-000000000000','c0000904-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── Administrative Skills (6 MCQ) ──────────────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000a01-0000-0000-0000-000000000000', 'e000000a-0000-0000-0000-000000000000', 'scenario_judgment', 'A visitor arrives for a 2:00 PM meeting, but the person they''re meeting is running 15 minutes late. What is the most professional response?', 1),
  ('c0000a02-0000-0000-0000-000000000000', 'e000000a-0000-0000-0000-000000000000', 'multiple_choice_single', 'When scheduling a meeting across multiple time zones, what should you always confirm first?', 1),
  ('c0000a03-0000-0000-0000-000000000000', 'e000000a-0000-0000-0000-000000000000', 'multiple_choice_single', 'What is the standard business filing method for organizing correspondence by date?', 1),
  ('c0000a04-0000-0000-0000-000000000000', 'e000000a-0000-0000-0000-000000000000', 'scenario_judgment', 'An executive asks you to draft a memo announcing a policy change. What should you confirm before sending it?', 1),
  ('c0000a05-0000-0000-0000-000000000000', 'e000000a-0000-0000-0000-000000000000', 'multiple_choice_single', 'What is the most appropriate way to handle a confidential document that needs to be discarded?', 1),
  ('c0000a06-0000-0000-0000-000000000000', 'e000000a-0000-0000-0000-000000000000', 'scenario_judgment', 'A caller asks for details about a coworker''s schedule that seem unusual for the situation. What is the best practice?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000a01-0000-0000-0000-000000000000', 'c0000a01-0000-0000-0000-000000000000', 'Tell the visitor to come back later', 'a', false, 0),
  ('d0000a02-0000-0000-0000-000000000000', 'c0000a01-0000-0000-0000-000000000000', 'Ignore the visitor until the meeting starts', 'b', false, 1),
  ('d0000a03-0000-0000-0000-000000000000', 'c0000a01-0000-0000-0000-000000000000', 'Inform the visitor of the delay, offer a seat and refreshment, and let them know when the person will be available', 'c', true, 2),
  ('d0000a04-0000-0000-0000-000000000000', 'c0000a01-0000-0000-0000-000000000000', 'Cancel the meeting', 'd', false, 3),

  ('d0000a11-0000-0000-0000-000000000000', 'c0000a02-0000-0000-0000-000000000000', 'The meeting room color', 'a', false, 0),
  ('d0000a12-0000-0000-0000-000000000000', 'c0000a02-0000-0000-0000-000000000000', 'Each attendee''s local time for the proposed slot', 'b', true, 1),
  ('d0000a13-0000-0000-0000-000000000000', 'c0000a02-0000-0000-0000-000000000000', 'The catering order', 'c', false, 2),
  ('d0000a14-0000-0000-0000-000000000000', 'c0000a02-0000-0000-0000-000000000000', 'The dress code', 'd', false, 3),

  ('d0000a21-0000-0000-0000-000000000000', 'c0000a03-0000-0000-0000-000000000000', 'Alphabetical filing', 'a', false, 0),
  ('d0000a22-0000-0000-0000-000000000000', 'c0000a03-0000-0000-0000-000000000000', 'Chronological filing', 'b', true, 1),
  ('d0000a23-0000-0000-0000-000000000000', 'c0000a03-0000-0000-0000-000000000000', 'Geographic filing', 'c', false, 2),
  ('d0000a24-0000-0000-0000-000000000000', 'c0000a03-0000-0000-0000-000000000000', 'Numeric filing', 'd', false, 3),

  ('d0000a31-0000-0000-0000-000000000000', 'c0000a04-0000-0000-0000-000000000000', 'Nothing, send it immediately', 'a', false, 0),
  ('d0000a32-0000-0000-0000-000000000000', 'c0000a04-0000-0000-0000-000000000000', 'The recipient list, tone, and that the executive has approved the final wording', 'b', true, 1),
  ('d0000a33-0000-0000-0000-000000000000', 'c0000a04-0000-0000-0000-000000000000', 'Only the font used', 'c', false, 2),
  ('d0000a34-0000-0000-0000-000000000000', 'c0000a04-0000-0000-0000-000000000000', 'The memo''s page count', 'd', false, 3),

  ('d0000a41-0000-0000-0000-000000000000', 'c0000a05-0000-0000-0000-000000000000', 'Recycle it with other paper', 'a', false, 0),
  ('d0000a42-0000-0000-0000-000000000000', 'c0000a05-0000-0000-0000-000000000000', 'Leave it in an open bin', 'b', false, 1),
  ('d0000a43-0000-0000-0000-000000000000', 'c0000a05-0000-0000-0000-000000000000', 'Shred it', 'c', true, 2),
  ('d0000a44-0000-0000-0000-000000000000', 'c0000a05-0000-0000-0000-000000000000', 'Email it to yourself first', 'd', false, 3),

  ('d0000a51-0000-0000-0000-000000000000', 'c0000a06-0000-0000-0000-000000000000', 'Give the caller full details', 'a', false, 0),
  ('d0000a52-0000-0000-0000-000000000000', 'c0000a06-0000-0000-0000-000000000000', 'Politely decline to share the details and offer to take a message instead', 'b', true, 1),
  ('d0000a53-0000-0000-0000-000000000000', 'c0000a06-0000-0000-0000-000000000000', 'Hang up immediately', 'c', false, 2),
  ('d0000a54-0000-0000-0000-000000000000', 'c0000a06-0000-0000-0000-000000000000', 'Ask the caller to call back with no explanation', 'd', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b000000a-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000a01-0000-0000-0000-000000000000','c0000a02-0000-0000-0000-000000000000','c0000a03-0000-0000-0000-000000000000',
  'c0000a04-0000-0000-0000-000000000000','c0000a05-0000-0000-0000-000000000000','c0000a06-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── Workplace Competencies (6 scenario judgment) ──────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000b01-0000-0000-0000-000000000000', 'e000000b-0000-0000-0000-000000000000', 'scenario_judgment', 'A teammate misses a shared deadline, which puts your part of the project at risk. What is the best first step?', 1),
  ('c0000b02-0000-0000-0000-000000000000', 'e000000b-0000-0000-0000-000000000000', 'scenario_judgment', 'You disagree with a decision your manager made in a team meeting. What is the most professional response?', 1),
  ('c0000b03-0000-0000-0000-000000000000', 'e000000b-0000-0000-0000-000000000000', 'scenario_judgment', 'You realize you made a mistake that affected a customer. What should you do?', 1),
  ('c0000b04-0000-0000-0000-000000000000', 'e000000b-0000-0000-0000-000000000000', 'scenario_judgment', 'A coworker asks you to cover for them so they can leave early without telling their manager. What should you do?', 1),
  ('c0000b05-0000-0000-0000-000000000000', 'e000000b-0000-0000-0000-000000000000', 'scenario_judgment', 'You''re given a task with unclear instructions and your manager is unavailable. What is the best approach?', 1),
  ('c0000b06-0000-0000-0000-000000000000', 'e000000b-0000-0000-0000-000000000000', 'scenario_judgment', 'During a busy period, a customer becomes frustrated and raises their voice at you. What is the most professional response?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000b01-0000-0000-0000-000000000000', 'c0000b01-0000-0000-0000-000000000000', 'Report them to your manager immediately', 'a', false, 0),
  ('d0000b02-0000-0000-0000-000000000000', 'c0000b01-0000-0000-0000-000000000000', 'Talk to the teammate directly to understand what happened and find a path forward', 'b', true, 1),
  ('d0000b03-0000-0000-0000-000000000000', 'c0000b01-0000-0000-0000-000000000000', 'Quietly redo their work yourself without saying anything', 'c', false, 2),
  ('d0000b04-0000-0000-0000-000000000000', 'c0000b01-0000-0000-0000-000000000000', 'Miss your own deadline in protest', 'd', false, 3),

  ('d0000b11-0000-0000-0000-000000000000', 'c0000b02-0000-0000-0000-000000000000', 'Argue with them in front of the team', 'a', false, 0),
  ('d0000b12-0000-0000-0000-000000000000', 'c0000b02-0000-0000-0000-000000000000', 'Say nothing and comply, even though you think it''s wrong', 'b', false, 1),
  ('d0000b13-0000-0000-0000-000000000000', 'c0000b02-0000-0000-0000-000000000000', 'Ask to discuss your concerns privately after the meeting', 'c', true, 2),
  ('d0000b14-0000-0000-0000-000000000000', 'c0000b02-0000-0000-0000-000000000000', 'Complain to coworkers about the decision', 'd', false, 3),

  ('d0000b21-0000-0000-0000-000000000000', 'c0000b03-0000-0000-0000-000000000000', 'Hope no one notices', 'a', false, 0),
  ('d0000b22-0000-0000-0000-000000000000', 'c0000b03-0000-0000-0000-000000000000', 'Blame someone else', 'b', false, 1),
  ('d0000b23-0000-0000-0000-000000000000', 'c0000b03-0000-0000-0000-000000000000', 'Report the mistake to your supervisor and help fix it', 'c', true, 2),
  ('d0000b24-0000-0000-0000-000000000000', 'c0000b03-0000-0000-0000-000000000000', 'Fix it quietly without telling anyone', 'd', false, 3),

  ('d0000b31-0000-0000-0000-000000000000', 'c0000b04-0000-0000-0000-000000000000', 'Agree without question', 'a', false, 0),
  ('d0000b32-0000-0000-0000-000000000000', 'c0000b04-0000-0000-0000-000000000000', 'Decline and suggest they speak with their manager directly', 'b', true, 1),
  ('d0000b33-0000-0000-0000-000000000000', 'c0000b04-0000-0000-0000-000000000000', 'Report them immediately without talking to them', 'c', false, 2),
  ('d0000b34-0000-0000-0000-000000000000', 'c0000b04-0000-0000-0000-000000000000', 'Cover for them and say nothing', 'd', false, 3),

  ('d0000b41-0000-0000-0000-000000000000', 'c0000b05-0000-0000-0000-000000000000', 'Wait until your manager is available before doing anything', 'a', false, 0),
  ('d0000b42-0000-0000-0000-000000000000', 'c0000b05-0000-0000-0000-000000000000', 'Guess and hope for the best', 'b', false, 1),
  ('d0000b43-0000-0000-0000-000000000000', 'c0000b05-0000-0000-0000-000000000000', 'Make your best reasonable interpretation, proceed, and confirm with your manager as soon as they''re available', 'c', true, 2),
  ('d0000b44-0000-0000-0000-000000000000', 'c0000b05-0000-0000-0000-000000000000', 'Ignore the task', 'd', false, 3),

  ('d0000b51-0000-0000-0000-000000000000', 'c0000b06-0000-0000-0000-000000000000', 'Raise your voice back', 'a', false, 0),
  ('d0000b52-0000-0000-0000-000000000000', 'c0000b06-0000-0000-0000-000000000000', 'Stay calm, listen, and try to resolve their concern professionally', 'b', true, 1),
  ('d0000b53-0000-0000-0000-000000000000', 'c0000b06-0000-0000-0000-000000000000', 'Hang up or walk away without a word', 'c', false, 2),
  ('d0000b54-0000-0000-0000-000000000000', 'c0000b06-0000-0000-0000-000000000000', 'Tell them to calm down immediately', 'd', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b000000b-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000b01-0000-0000-0000-000000000000','c0000b02-0000-0000-0000-000000000000','c0000b03-0000-0000-0000-000000000000',
  'c0000b04-0000-0000-0000-000000000000','c0000b05-0000-0000-0000-000000000000','c0000b06-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── AI Literacy (8 MCQ) ────────────────────────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000c01-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'multiple_choice_single', 'What is an "AI hallucination"?', 1),
  ('c0000c02-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'scenario_judgment', 'Before using an AI-generated summary of a legal document in your work, what should you do?', 1),
  ('c0000c03-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'scenario_judgment', 'Which of the following is a data privacy concern when using AI tools at work?', 1),
  ('c0000c04-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'multiple_choice_single', 'What does it mean for an AI model to have "bias"?', 1),
  ('c0000c05-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'scenario_judgment', 'Which practice best describes responsible use of AI for a work task?', 1),
  ('c0000c06-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'multiple_choice_single', 'What is "prompting" in the context of AI tools?', 1),
  ('c0000c07-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'multiple_choice_single', 'Why is human review important for AI-assisted decisions in hiring or HR contexts?', 1),
  ('c0000c08-0000-0000-0000-000000000000', 'e000000c-0000-0000-0000-000000000000', 'scenario_judgment', 'You ask an AI tool a factual question and it gives a confident, detailed answer. What should you still do?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000c01-0000-0000-0000-000000000000', 'c0000c01-0000-0000-0000-000000000000', 'A visual glitch in AI-generated images', 'a', false, 0),
  ('d0000c02-0000-0000-0000-000000000000', 'c0000c01-0000-0000-0000-000000000000', 'When an AI system generates confident but false or fabricated information', 'b', true, 1),
  ('d0000c03-0000-0000-0000-000000000000', 'c0000c01-0000-0000-0000-000000000000', 'When an AI model runs out of memory', 'c', false, 2),
  ('d0000c04-0000-0000-0000-000000000000', 'c0000c01-0000-0000-0000-000000000000', 'A type of computer virus', 'd', false, 3),

  ('d0000c11-0000-0000-0000-000000000000', 'c0000c02-0000-0000-0000-000000000000', 'Use it as-is without review', 'a', false, 0),
  ('d0000c12-0000-0000-0000-000000000000', 'c0000c02-0000-0000-0000-000000000000', 'Verify its accuracy against the original source', 'b', true, 1),
  ('d0000c13-0000-0000-0000-000000000000', 'c0000c02-0000-0000-0000-000000000000', 'Assume it is always correct', 'c', false, 2),
  ('d0000c14-0000-0000-0000-000000000000', 'c0000c02-0000-0000-0000-000000000000', 'Ask a different AI to confirm it, with no other check', 'd', false, 3),

  ('d0000c21-0000-0000-0000-000000000000', 'c0000c03-0000-0000-0000-000000000000', 'Pasting confidential customer information into a public AI chatbot', 'a', true, 0),
  ('d0000c22-0000-0000-0000-000000000000', 'c0000c03-0000-0000-0000-000000000000', 'Using AI to summarize a public news article', 'b', false, 1),
  ('d0000c23-0000-0000-0000-000000000000', 'c0000c03-0000-0000-0000-000000000000', 'Asking AI to explain a general concept', 'c', false, 2),
  ('d0000c24-0000-0000-0000-000000000000', 'c0000c03-0000-0000-0000-000000000000', 'Using AI to draft a template email with no personal data', 'd', false, 3),

  ('d0000c31-0000-0000-0000-000000000000', 'c0000c04-0000-0000-0000-000000000000', 'The model refuses to answer questions', 'a', false, 0),
  ('d0000c32-0000-0000-0000-000000000000', 'c0000c04-0000-0000-0000-000000000000', 'The model''s outputs can reflect skewed patterns present in its training data', 'b', true, 1),
  ('d0000c33-0000-0000-0000-000000000000', 'c0000c04-0000-0000-0000-000000000000', 'The model is always completely neutral', 'c', false, 2),
  ('d0000c34-0000-0000-0000-000000000000', 'c0000c04-0000-0000-0000-000000000000', 'The model runs slowly', 'd', false, 3),

  ('d0000c41-0000-0000-0000-000000000000', 'c0000c05-0000-0000-0000-000000000000', 'Using AI output without any review because it is usually right', 'a', false, 0),
  ('d0000c42-0000-0000-0000-000000000000', 'c0000c05-0000-0000-0000-000000000000', 'Treating AI as a tool that assists your judgment, with human review of important outputs', 'b', true, 1),
  ('d0000c43-0000-0000-0000-000000000000', 'c0000c05-0000-0000-0000-000000000000', 'Never using AI for anything', 'c', false, 2),
  ('d0000c44-0000-0000-0000-000000000000', 'c0000c05-0000-0000-0000-000000000000', 'Letting AI make final hiring decisions on its own', 'd', false, 3),

  ('d0000c51-0000-0000-0000-000000000000', 'c0000c06-0000-0000-0000-000000000000', 'Restarting the AI application', 'a', false, 0),
  ('d0000c52-0000-0000-0000-000000000000', 'c0000c06-0000-0000-0000-000000000000', 'The instructions or questions you give an AI system to get a useful response', 'b', true, 1),
  ('d0000c53-0000-0000-0000-000000000000', 'c0000c06-0000-0000-0000-000000000000', 'A type of AI hallucination', 'c', false, 2),
  ('d0000c54-0000-0000-0000-000000000000', 'c0000c06-0000-0000-0000-000000000000', 'The AI''s internal training process', 'd', false, 3),

  ('d0000c61-0000-0000-0000-000000000000', 'c0000c07-0000-0000-0000-000000000000', 'It isn''t important', 'a', false, 0),
  ('d0000c62-0000-0000-0000-000000000000', 'c0000c07-0000-0000-0000-000000000000', 'AI outputs can be inaccurate, biased, or missing context that a human would catch', 'b', true, 1),
  ('d0000c63-0000-0000-0000-000000000000', 'c0000c07-0000-0000-0000-000000000000', 'AI is always more accurate than humans', 'c', false, 2),
  ('d0000c64-0000-0000-0000-000000000000', 'c0000c07-0000-0000-0000-000000000000', 'Reviewing wastes time and should be skipped', 'd', false, 3),

  ('d0000c71-0000-0000-0000-000000000000', 'c0000c08-0000-0000-0000-000000000000', 'Trust it completely because it sounded confident', 'a', false, 0),
  ('d0000c72-0000-0000-0000-000000000000', 'c0000c08-0000-0000-0000-000000000000', 'Verify important facts against a reliable source before relying on it', 'b', true, 1),
  ('d0000c73-0000-0000-0000-000000000000', 'c0000c08-0000-0000-0000-000000000000', 'Ignore it entirely', 'c', false, 2),
  ('d0000c74-0000-0000-0000-000000000000', 'c0000c08-0000-0000-0000-000000000000', 'Share it immediately without checking', 'd', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b000000c-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000c01-0000-0000-0000-000000000000','c0000c02-0000-0000-0000-000000000000','c0000c03-0000-0000-0000-000000000000','c0000c04-0000-0000-0000-000000000000',
  'c0000c05-0000-0000-0000-000000000000','c0000c06-0000-0000-0000-000000000000','c0000c07-0000-0000-0000-000000000000','c0000c08-0000-0000-0000-000000000000'
)
on conflict do nothing;

-- ── IT Support Fundamentals (6 MCQ) ────────────────────────────────────────
insert into public.questions (id, question_bank_id, type, prompt, points) values
  ('c0000e01-0000-0000-0000-000000000000', 'e000000e-0000-0000-0000-000000000000', 'scenario_judgment', 'A user reports their computer won''t turn on. What is the first troubleshooting step?', 1),
  ('c0000e02-0000-0000-0000-000000000000', 'e000000e-0000-0000-0000-000000000000', 'scenario_judgment', 'A user can''t connect to Wi-Fi but other devices on the same network work fine. What should you check first?', 1),
  ('c0000e03-0000-0000-0000-000000000000', 'e000000e-0000-0000-0000-000000000000', 'multiple_choice_single', 'What is the purpose of restarting a device when troubleshooting minor software issues?', 1),
  ('c0000e04-0000-0000-0000-000000000000', 'e000000e-0000-0000-0000-000000000000', 'scenario_judgment', E'A customer''s ticket says "the internet is slow." What is the best first question to ask?', 1),
  ('c0000e05-0000-0000-0000-000000000000', 'e000000e-0000-0000-0000-000000000000', 'multiple_choice_single', 'Which of these is a good basic first step when a printer won''t print?', 1),
  ('c0000e06-0000-0000-0000-000000000000', 'e000000e-0000-0000-0000-000000000000', 'scenario_judgment', 'A user forgot their password. What is the appropriate support response?', 1)
on conflict (id) do nothing;

insert into public.question_options (id, question_id, label, value, is_correct, display_order) values
  ('d0000e01-0000-0000-0000-000000000000', 'c0000e01-0000-0000-0000-000000000000', 'Replace the motherboard', 'a', false, 0),
  ('d0000e02-0000-0000-0000-000000000000', 'c0000e01-0000-0000-0000-000000000000', 'Check that it is plugged in and the outlet has power', 'b', true, 1),
  ('d0000e03-0000-0000-0000-000000000000', 'c0000e01-0000-0000-0000-000000000000', 'Reinstall the operating system', 'c', false, 2),
  ('d0000e04-0000-0000-0000-000000000000', 'c0000e01-0000-0000-0000-000000000000', 'Order a new computer', 'd', false, 3),

  ('d0000e11-0000-0000-0000-000000000000', 'c0000e02-0000-0000-0000-000000000000', 'The building''s electrical wiring', 'a', false, 0),
  ('d0000e12-0000-0000-0000-000000000000', 'c0000e02-0000-0000-0000-000000000000', 'That device''s Wi-Fi is turned on and connected to the correct network', 'b', true, 1),
  ('d0000e13-0000-0000-0000-000000000000', 'c0000e02-0000-0000-0000-000000000000', 'The internet service provider''s data center', 'c', false, 2),
  ('d0000e14-0000-0000-0000-000000000000', 'c0000e02-0000-0000-0000-000000000000', 'Replace the router immediately', 'd', false, 3),

  ('d0000e21-0000-0000-0000-000000000000', 'c0000e03-0000-0000-0000-000000000000', 'It permanently deletes all files', 'a', false, 0),
  ('d0000e22-0000-0000-0000-000000000000', 'c0000e03-0000-0000-0000-000000000000', 'It clears temporary memory/state and can resolve many minor glitches', 'b', true, 1),
  ('d0000e23-0000-0000-0000-000000000000', 'c0000e03-0000-0000-0000-000000000000', 'It always fixes hardware failures', 'c', false, 2),
  ('d0000e24-0000-0000-0000-000000000000', 'c0000e03-0000-0000-0000-000000000000', 'It has no real effect', 'd', false, 3),

  ('d0000e31-0000-0000-0000-000000000000', 'c0000e04-0000-0000-0000-000000000000', 'Assume it is the router and replace it immediately', 'a', false, 0),
  ('d0000e32-0000-0000-0000-000000000000', 'c0000e04-0000-0000-0000-000000000000', 'Ask clarifying questions to understand what "slow" means and when it happens', 'b', true, 1),
  ('d0000e33-0000-0000-0000-000000000000', 'c0000e04-0000-0000-0000-000000000000', 'Close the ticket without responding', 'c', false, 2),
  ('d0000e34-0000-0000-0000-000000000000', 'c0000e04-0000-0000-0000-000000000000', 'Tell them to buy a new computer', 'd', false, 3),

  ('d0000e41-0000-0000-0000-000000000000', 'c0000e05-0000-0000-0000-000000000000', 'Check the printer is powered on, connected, and has paper/ink', 'a', true, 0),
  ('d0000e42-0000-0000-0000-000000000000', 'c0000e05-0000-0000-0000-000000000000', 'Reinstall the entire operating system', 'b', false, 1),
  ('d0000e43-0000-0000-0000-000000000000', 'c0000e05-0000-0000-0000-000000000000', 'Replace the printer immediately', 'c', false, 2),
  ('d0000e44-0000-0000-0000-000000000000', 'c0000e05-0000-0000-0000-000000000000', 'Ignore it', 'd', false, 3),

  ('d0000e51-0000-0000-0000-000000000000', 'c0000e06-0000-0000-0000-000000000000', 'Ask them to tell you their old password so you can verify it', 'a', false, 0),
  ('d0000e52-0000-0000-0000-000000000000', 'c0000e06-0000-0000-0000-000000000000', 'Guide them through your organization''s official password reset process', 'b', true, 1),
  ('d0000e53-0000-0000-0000-000000000000', 'c0000e06-0000-0000-0000-000000000000', 'Give them your own login to use temporarily', 'c', false, 2),
  ('d0000e54-0000-0000-0000-000000000000', 'c0000e06-0000-0000-0000-000000000000', 'Ignore the request', 'd', false, 3)
on conflict (id) do nothing;

insert into public.assessment_questions (section_id, question_id, display_order)
select 'b000000e-0000-0000-0000-000000000000', id, row_number() over (order by id) - 1
from public.questions where id in (
  'c0000e01-0000-0000-0000-000000000000','c0000e02-0000-0000-0000-000000000000','c0000e03-0000-0000-0000-000000000000',
  'c0000e04-0000-0000-0000-000000000000','c0000e05-0000-0000-0000-000000000000','c0000e06-0000-0000-0000-000000000000'
)
on conflict do nothing;
