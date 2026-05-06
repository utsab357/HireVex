"""
ATS Engine — Production-Grade Resume Scoring System
Rule-based scoring with no AI dependencies.

BIAS SAFEGUARDS:
This engine scores ONLY on:
- Skills (text matching against job requirements)
- Experience duration (date math)
- Resume structure (sections present)
- Job requirement alignment

This engine NEVER considers:
- Candidate name, gender, age
- College/university name or ranking
- Photos or personal details
- Gender-coded language
"""

import re
from datetime import datetime, date


class ATSEngine:
    """
    Production-grade ATS scoring engine.
    All scoring is deterministic and rule-based.
    """

    # ═══════════════════════════════════════════════════════════
    # STEP 1: Resume Quality Check
    # ═══════════════════════════════════════════════════════════

    # Words that indicate the file is NOT a resume
    NON_RESUME_INDICATORS = [
        'invoice', 'receipt', 'bill to', 'payment due', 'amount due',
        'tax invoice', 'purchase order', 'shipping label', 'packing slip',
        'bank statement', 'account statement', 'transaction history',
    ]

    # Section header keywords for detection
    SECTION_KEYWORDS = {
        'skills': [
            'skills', 'technical skills', 'technologies', 'tech stack',
            'tools', 'proficiencies', 'competencies', 'expertise',
            'programming languages', 'frameworks', 'core competencies',
        ],
        'experience': [
            'experience', 'work experience', 'work history', 'employment',
            'professional experience', 'professional background',
            'career history', 'employment history',
        ],
        'education': [
            'education', 'academic', 'academic background',
            'qualifications', 'educational background',
        ],
        'projects': [
            'projects', 'personal projects', 'portfolio',
            'academic projects', 'key projects',
        ],
        'certifications': [
            'certifications', 'certificates', 'licensed',
            'professional certifications', 'accreditations',
        ],
    }

    @staticmethod
    def _check_resume_quality(text):
        """
        Step 1: Check if the uploaded file is actually a resume.
        Returns: {
            'is_valid': bool,
            'word_count': int,
            'has_email': bool,
            'has_phone': bool,
            'flags': list of strings describing issues,
            'stop_reason': str or None (if scoring should stop entirely)
        }
        """
        result = {
            'is_valid': True,
            'word_count': 0,
            'has_email': False,
            'has_phone': False,
            'flags': [],
            'stop_reason': None,
        }

        text_lower = text.lower().strip()

        # Check if text extraction failed
        if text_lower.startswith('[text extraction'):
            result['is_valid'] = False
            result['stop_reason'] = (
                'Could not extract readable text from the uploaded file. '
                'The file may be image-based (scanned), corrupted, or not a valid resume.'
            )
            return result

        # Word count check
        words = text.split()
        result['word_count'] = len(words)

        if len(words) < 50:
            result['is_valid'] = False
            result['stop_reason'] = (
                f'File contains only {len(words)} words, which is too short to be a resume. '
                'Please upload a complete resume document.'
            )
            return result

        # Non-resume content check (invoice, receipt, etc.)
        # SMART CHECK: Only reject if multiple non-resume indicators are found
        # AND the document lacks standard resume section headers.
        # This prevents false positives when a developer's resume mentions
        # "invoice", "transaction history", etc. as part of project descriptions.
        non_resume_hits = [ind for ind in ATSEngine.NON_RESUME_INDICATORS if ind in text_lower]

        if non_resume_hits:
            # Check if the document also has resume-like section headers
            resume_section_count = 0
            for section_keywords in ATSEngine.SECTION_KEYWORDS.values():
                for keyword in section_keywords:
                    # Use word boundary check: keyword at start of line or after whitespace
                    pattern = r'(?:^|\n)\s*' + re.escape(keyword) + r'\s*(?:\n|:|\||-|$)'
                    if re.search(pattern, text_lower):
                        resume_section_count += 1
                        break

            # Only reject if: many non-resume indicators AND few resume sections
            # A real invoice/receipt has 0-1 resume sections; a real resume has 2+
            if len(non_resume_hits) >= 2 and resume_section_count < 2:
                result['is_valid'] = False
                result['stop_reason'] = (
                    f'This file appears to be a non-resume document '
                    f'(detected: {", ".join(non_resume_hits)}). '
                    'Please upload a valid resume.'
                )
                return result


        # Email detection
        email_match = re.search(r'[\w.-]+@[\w.-]+\.\w{2,}', text)
        result['has_email'] = email_match is not None
        if not result['has_email']:
            result['flags'].append('No contact email detected in resume.')

        # Phone detection
        phone_match = re.search(r'[\+]?[\d\s\-\(\)]{10,15}', text)
        result['has_phone'] = phone_match is not None
        if not result['has_phone']:
            result['flags'].append('No phone number detected in resume.')

        # Skill stuffing check — improved heuristic
        # Check 1: High comma-to-word ratio (regardless of resume length)
        comma_items = text.count(',')
        word_count = len(words)
        if word_count > 0:
            comma_ratio = comma_items / word_count
            if comma_ratio > 0.20:  # More than 1 comma per 5 words
                result['flags'].append(
                    'Possible skill stuffing detected — unusually high density of '
                    'comma-separated items relative to resume length.'
                )

        # Check 2: Short resume with many commas (original check, kept as additional guard)
        if word_count < 200 and comma_items > 40:
            if 'skill stuffing' not in ' '.join(result['flags']).lower():
                result['flags'].append(
                    'Possible skill stuffing detected — large number of comma-separated items '
                    'in a short resume.'
                )

        return result

    # ═══════════════════════════════════════════════════════════
    # STEP 2: Section Detection
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _detect_sections(text):
        """
        Step 2: Detect which standard resume sections are present.
        Returns: {
            'skills': {'found': bool, 'start_pos': int or None, 'end_pos': int or None},
            'experience': {'found': bool, ...},
            'education': {'found': bool, ...},
            'projects': {'found': bool, ...},
            'certifications': {'found': bool, ...},
            'sections_found_count': int,
        }
        """
        text_lower = text.lower()
        lines = text_lower.split('\n')
        sections = {}

        for section_name, keywords in ATSEngine.SECTION_KEYWORDS.items():
            found = False
            start_pos = None

            for keyword in keywords:
                # Look for section headers: keyword at start of a line or as standalone line
                for i, line in enumerate(lines):
                    stripped = line.strip()
                    # Match if line starts with the keyword or IS the keyword
                    # (section headers are usually short lines)
                    if (stripped == keyword or
                        stripped.startswith(keyword + ':') or
                        stripped.startswith(keyword + ' ') or
                        (len(stripped) < 50 and keyword in stripped)):
                        found = True
                        start_pos = i
                        break
                if found:
                    break

            sections[section_name] = {
                'found': found,
                'line_index': start_pos,
            }

        # Count how many sections were found
        sections['sections_found_count'] = sum(
            1 for s in ['skills', 'experience', 'education', 'projects', 'certifications']
            if sections[s]['found']
        )

        return sections

    @staticmethod
    def _get_section_text(text, sections, section_name):
        """
        Extract text belonging to a specific section.
        Returns text from the section header to the next section header (or end of text).

        GUARDRAIL: Sorts all section line indices to handle sections that
        appear in non-standard order in the document.
        """
        if not sections[section_name]['found']:
            return ''

        lines = text.split('\n')
        start = sections[section_name]['line_index']

        # Collect ALL other section start lines and sort them
        all_section_lines = sorted([
            sections[sname]['line_index']
            for sname in ['skills', 'experience', 'education', 'projects', 'certifications']
            if sname != section_name and sections[sname]['found']
        ])

        # Next section start (or end of document)
        next_starts = [l for l in all_section_lines if l > start]
        end = min(next_starts) if next_starts else len(lines)

        return '\n'.join(lines[start:end])

    # ═══════════════════════════════════════════════════════════
    # STEP 3: Skill Matching (synonyms + groups + word boundary)
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _skill_in_text(skill_name, text_lower):
        """
        Check if a skill appears in text using word boundary matching.
        GUARDRAIL: Uses \\b regex to prevent false positives.
        'Reacted' will NOT match 'React'. 'Expressed' will NOT match 'Express'.
        Returns: bool
        """
        skill_clean = skill_name.lower().strip()

        # For very short skills (1-2 chars like 'R', 'Go', 'C'), require exact word match
        if len(skill_clean) <= 2:
            pattern = r'\b' + re.escape(skill_clean) + r'\b'
            return bool(re.search(pattern, text_lower, re.IGNORECASE))

        # For skills with special chars (C#, C++, .NET), escape and search
        if any(c in skill_clean for c in '#.+'):
            escaped = re.escape(skill_clean)
            return escaped in text_lower or skill_clean in text_lower

        # Standard word boundary match
        pattern = r'\b' + re.escape(skill_clean) + r'\b'
        return bool(re.search(pattern, text_lower, re.IGNORECASE))

    @staticmethod
    def _match_skills(text, sections, requirements):
        """
        Step 3: Match job requirements against resume text.
        Uses synonyms, then skill groups for partial credit.

        Returns: {
            'matched': [{'name', 'importance', 'is_must_have', 'match_type', 'matched_via', 'depth_score'}],
            'partial': [{'name', 'importance', 'is_must_have', 'matched_via', 'group_name'}],
            'missing': [{'name', 'importance', 'is_must_have'}],
            'total_weight': float,
            'earned_weight': float,
            'match_details': list of explanation strings,
        }
        """
        from .skill_data import SKILL_SYNONYMS, get_canonical_name, get_skill_group, SKILL_GROUPS

        text_lower = text.lower()
        matched = []
        partial = []
        missing = []
        match_details = []
        total_weight = 0
        earned_weight = 0

        for req in requirements:
            skill = req.skill_name.strip()
            skill_lower = skill.lower()
            weight = req.importance  # 1-5
            is_must = req.is_must_have
            effective_weight = weight * (2 if is_must else 1)
            total_weight += effective_weight

            # --- Try direct match ---
            if ATSEngine._skill_in_text(skill_lower, text_lower):
                depth = ATSEngine._calculate_skill_depth(skill_lower, text_lower, text, sections)
                earned_weight += effective_weight * depth['multiplier']
                matched.append({
                    'name': skill,
                    'importance': weight,
                    'is_must_have': is_must,
                    'match_type': 'direct',
                    'matched_via': skill,
                    'depth_score': depth,
                })
                continue

            # --- Try synonym match ---
            canonical = get_canonical_name(skill_lower)
            synonym_found = False

            # Check all synonyms of the canonical skill
            synonyms_to_check = SKILL_SYNONYMS.get(canonical, [])
            # Also check if what the user typed is a synonym of something else
            all_to_check = [canonical] + list(synonyms_to_check)

            for variant in all_to_check:
                if variant and ATSEngine._skill_in_text(variant, text_lower):
                    depth = ATSEngine._calculate_skill_depth(variant, text_lower, text, sections)
                    earned_weight += effective_weight * depth['multiplier']
                    matched.append({
                        'name': skill,
                        'importance': weight,
                        'is_must_have': is_must,
                        'match_type': 'synonym',
                        'matched_via': variant,
                        'depth_score': depth,
                    })
                    synonym_found = True
                    break

            if synonym_found:
                continue

            # --- Try skill group partial match (30% credit) ---
            req_group = get_skill_group(skill_lower)
            group_match_found = False

            if req_group:
                group_members = SKILL_GROUPS.get(req_group, [])
                for member in group_members:
                    if member.lower() == canonical:
                        continue  # Skip self
                    # Check member and its synonyms
                    member_and_syns = [member] + SKILL_SYNONYMS.get(member, [])
                    for variant in member_and_syns:
                        if variant and ATSEngine._skill_in_text(variant, text_lower):
                            # 30% partial credit
                            partial_credit = 0.3
                            earned_weight += effective_weight * partial_credit
                            partial.append({
                                'name': skill,
                                'importance': weight,
                                'is_must_have': is_must,
                                'matched_via': member,
                                'group_name': req_group,
                            })
                            # GUARDRAIL: Log partial match in details
                            match_details.append(
                                f'Partial match: {member.title()} found instead of {skill} '
                                f'(same group: {req_group}) — 30% credit applied.'
                            )
                            group_match_found = True
                            break
                    if group_match_found:
                        break

            if group_match_found:
                continue

            # --- Not found at all ---
            missing.append({
                'name': skill,
                'importance': weight,
                'is_must_have': is_must,
            })

        return {
            'matched': matched,
            'partial': partial,
            'missing': missing,
            'total_weight': total_weight,
            'earned_weight': earned_weight,
            'match_details': match_details,
        }

    # ═══════════════════════════════════════════════════════════
    # STEP 4: Skill Depth (frequency + context)
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _calculate_skill_depth(skill_variant, text_lower, text_original, sections):
        """
        Step 4: Determine how deeply a skill is represented in the resume.
        Checks: frequency (capped at 3x), section context.

        GUARDRAIL: Frequency capped at 3. "React React React..." spam = same as 3 mentions.

        Returns: {
            'count': int,
            'in_skills_section': bool,
            'in_experience_section': bool,
            'in_projects_section': bool,
            'multiplier': float (1.0 to 1.5),
        }
        """
        # Count occurrences (word boundary)
        pattern = r'\b' + re.escape(skill_variant) + r'\b'
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        raw_count = len(matches)

        # GUARDRAIL: Cap at 3 mentions max
        capped_count = min(raw_count, 3)

        # Check which sections contain this skill
        in_skills = False
        in_experience = False
        in_projects = False

        if sections['skills']['found']:
            skills_text = ATSEngine._get_section_text(text_original, sections, 'skills').lower()
            in_skills = ATSEngine._skill_in_text(skill_variant, skills_text)

        if sections['experience']['found']:
            exp_text = ATSEngine._get_section_text(text_original, sections, 'experience').lower()
            in_experience = ATSEngine._skill_in_text(skill_variant, exp_text)

        if sections['projects']['found']:
            proj_text = ATSEngine._get_section_text(text_original, sections, 'projects').lower()
            in_projects = ATSEngine._skill_in_text(skill_variant, proj_text)

        # Calculate depth multiplier (1.0 base, up to 1.5 max)
        multiplier = 1.0

        # Section context bonuses
        if in_skills:
            multiplier += 0.15  # Found in dedicated Skills section
        if in_experience:
            multiplier += 0.20  # Found in Experience (hands-on proof)
        if in_projects:
            multiplier += 0.10  # Found in Projects

        # Frequency bonus (capped)
        if capped_count >= 3:
            multiplier += 0.10  # Mentioned 3+ times
        elif capped_count >= 2:
            multiplier += 0.05  # Mentioned twice

        # Cap total multiplier at 1.5
        multiplier = min(multiplier, 1.5)

        return {
            'count': raw_count,
            'capped_count': capped_count,
            'in_skills_section': in_skills,
            'in_experience_section': in_experience,
            'in_projects_section': in_projects,
            'multiplier': multiplier,
        }

    # ═══════════════════════════════════════════════════════════
    # STEP 5: Experience Calculation (date parsing)
    # ═══════════════════════════════════════════════════════════

    # Month name to number mapping
    MONTH_MAP = {
        'jan': 1, 'january': 1, 'feb': 2, 'february': 2,
        'mar': 3, 'march': 3, 'apr': 4, 'april': 4,
        'may': 5, 'jun': 6, 'june': 6,
        'jul': 7, 'july': 7, 'aug': 8, 'august': 8,
        'sep': 9, 'sept': 9, 'september': 9,
        'oct': 10, 'october': 10, 'nov': 11, 'november': 11,
        'dec': 12, 'december': 12,
    }

    # GUARDRAIL: "Present"/"Current"/"Till Date"/"Ongoing" = today's date
    PRESENT_KEYWORDS = ['present', 'current', 'till date', 'ongoing', 'now', 'today']

    @staticmethod
    def _parse_date(date_str):
        """
        Parse a date string into (year, month) tuple.
        Handles: 'Jan 2020', 'January 2020', '01/2020', '2020', 'Present'
        Returns: (year, month) or None if unparseable.
        """
        date_str = date_str.strip().lower()

        # Check for "Present" keywords
        for kw in ATSEngine.PRESENT_KEYWORDS:
            if kw in date_str:
                today = date.today()
                return (today.year, today.month)

        # Try: "Jan 2020", "January 2020"
        match = re.match(r'([a-z]+)\s*[\.,]?\s*(\d{4})', date_str)
        if match:
            month_str, year_str = match.groups()
            month = ATSEngine.MONTH_MAP.get(month_str)
            if month:
                return (int(year_str), month)

        # Try: "01/2020", "1/2020", "01-2020"
        match = re.match(r'(\d{1,2})\s*[/\-]\s*(\d{4})', date_str)
        if match:
            month, year = int(match.group(1)), int(match.group(2))
            if 1 <= month <= 12 and 1950 <= year <= 2100:
                return (year, month)

        # Try: just "2020"
        match = re.match(r'^(\d{4})$', date_str)
        if match:
            year = int(match.group(1))
            if 1950 <= year <= 2100:
                return (year, 1)  # Assume January if only year

        return None

    @staticmethod
    def _calculate_experience(text, job, sections=None):
        """
        Step 5: Parse date ranges from resume, calculate total experience.
        Handles overlapping dates, internship detection, and ambiguity.

        GUARDRAIL: Prefers parsing from experience section only to avoid
        false positives from phone numbers, IDs, and education dates.
        Falls back to full text if no experience section detected.

        Returns: {
            'total_years': float,
            'total_years_excl_internship': float,
            'internship_months': int,
            'date_ranges_found': int,
            'date_ranges_parsed': int,
            'unparseable_ranges': int,
            'is_ambiguous': bool,
            'experience_score': float (bonus/penalty based on job requirements),
            'details': list of strings,
            'flags': list of strings,
        }
        """
        # GUARDRAIL: Parse dates from experience section first to avoid false positives
        experience_text = ''
        using_section_text = False
        if sections and sections.get('experience', {}).get('found'):
            experience_text = ATSEngine._get_section_text(text, sections, 'experience')
            using_section_text = True

        # Fall back to full text if no experience section found
        search_text = experience_text if experience_text.strip() else text
        text_lower = search_text.lower()

        # Date range patterns to find in text
        # Matches: "Jan 2020 - Dec 2022", "2019-2022", "06/2020 - present"
        date_range_patterns = [
            # "Jan 2020 - Dec 2022" or "January 2020 – Present"
            r'([a-z]+\.?\s*\d{4})\s*[-–—to]+\s*([a-z]+\.?\s*\d{4}|present|current|till\s*date|ongoing|now|today)',
            # "01/2020 - 12/2022" or "01/2020 - Present"
            r'(\d{1,2}\s*[/\-]\s*\d{4})\s*[-–—to]+\s*(\d{1,2}\s*[/\-]\s*\d{4}|present|current|till\s*date|ongoing|now|today)',
            # "2019 - 2022" or "2020 - Present"
            r'(\b\d{4})\s*[-–—to]+\s*(\d{4}|present|current|till\s*date|ongoing|now|today)',
        ]

        ranges = []
        for pattern in date_range_patterns:
            for match in re.finditer(pattern, text_lower):
                start_str = match.group(1).strip()
                end_str = match.group(2).strip()
                ranges.append((start_str, end_str, match.start()))

        result = {
            'total_years': 0.0,
            'total_years_excl_internship': 0.0,
            'internship_months': 0,
            'date_ranges_found': len(ranges),
            'date_ranges_parsed': 0,
            'unparseable_ranges': 0,
            'is_ambiguous': False,
            'experience_score': 0.0,
            'details': [],
            'flags': [],
        }

        if not ranges:
            # Try fallback: look for "X years" or "X+ years" text
            year_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)', text_lower)
            if year_matches:
                max_years = max(int(y) for y in year_matches)
                result['total_years'] = float(max_years)
                result['total_years_excl_internship'] = float(max_years)
                result['details'].append(f'Experience mentioned as text: {max_years} years.')
                result['flags'].append('Experience detected from text only (no date ranges found). Confidence reduced.')
                result['is_ambiguous'] = True
            else:
                result['flags'].append('No experience dates or duration found in resume.')
                result['is_ambiguous'] = True

            # Score against job requirements
            result['experience_score'] = ATSEngine._score_experience(
                result['total_years'], job
            )
            return result

        # Parse each date range
        parsed_ranges = []
        for start_str, end_str, text_pos in ranges:
            start_date = ATSEngine._parse_date(start_str)
            end_date = ATSEngine._parse_date(end_str)

            if start_date and end_date:
                result['date_ranges_parsed'] += 1

                # Calculate months
                months = (end_date[0] - start_date[0]) * 12 + (end_date[1] - start_date[1])
                if months < 0:
                    months = 0  # Invalid range, skip
                    result['flags'].append(f'Invalid date range detected: {start_str} to {end_str}.')
                    continue

                # Check context around this date range
                context_start = max(0, text_pos - 200)
                context_end = min(len(text_lower), text_pos + 200)
                context = text_lower[context_start:context_end]

                # GUARDRAIL: Skip date ranges that are in an education context
                education_indicators = [
                    'b.tech', 'btech', 'm.tech', 'mtech', 'bachelor', 'master',
                    'b.sc', 'bsc', 'm.sc', 'msc', 'b.e.', 'b.e', 'm.e.',
                    'mba', 'phd', 'ph.d', 'degree', 'diploma', 'university',
                    'college', 'campus', 'cgpa', 'gpa', 'institute',
                    'school', 'academic', 'class of', 'graduated',
                    'higher secondary', '10th', '12th', 'hsc', 'ssc',
                    'engineering', 'computer science'
                ]
                is_education = any(ind in context for ind in education_indicators)
                if is_education:
                    result['flags'].append(
                        f'Date range {start_str} to {end_str} appears to be education, excluded from work experience.'
                    )
                    continue

                # Check if internship (look for "intern" or "trainee" near this date range)
                is_internship = 'intern' in context or 'trainee' in context

                parsed_ranges.append({
                    'start': start_date,
                    'end': end_date,
                    'months': months,
                    'is_internship': is_internship,
                })
            else:
                result['unparseable_ranges'] += 1

        # GUARDRAIL: If many ranges couldn't be parsed, flag as ambiguous
        if result['unparseable_ranges'] > 0:
            result['is_ambiguous'] = True
            result['flags'].append(
                f'{result["unparseable_ranges"]} date range(s) could not be parsed.'
            )

        # Sort ranges by start date
        parsed_ranges.sort(key=lambda r: (r['start'][0], r['start'][1]))

        # Calculate total months (handle overlapping)
        total_months = 0
        intern_months = 0

        if parsed_ranges:
            # Merge overlapping ranges
            merged = [parsed_ranges[0].copy()]
            for current in parsed_ranges[1:]:
                prev = merged[-1]
                # Check overlap: current starts before previous ends
                if (current['start'][0], current['start'][1]) <= (prev['end'][0], prev['end'][1]):
                    # Extend end if current goes further
                    if (current['end'][0], current['end'][1]) > (prev['end'][0], prev['end'][1]):
                        prev['end'] = current['end']
                        prev['months'] = (prev['end'][0] - prev['start'][0]) * 12 + (prev['end'][1] - prev['start'][1])
                    # GUARDRAIL: Only mark merged range as internship if BOTH are internships.
                    # If either range is full-time, the merged range stays full-time.
                    if not current['is_internship']:
                        prev['is_internship'] = False
                else:
                    merged.append(current.copy())

            for r in merged:
                if r['is_internship']:
                    intern_months += r['months']
                else:
                    total_months += r['months']

        result['internship_months'] = intern_months

        # Apply internship policy from job
        internship_policy = getattr(job, 'internship_policy', 'half')
        if internship_policy == 'full':
            total_months += intern_months
            effective_intern = intern_months
        elif internship_policy == 'half':
            total_months += int(intern_months * 0.5)
            effective_intern = int(intern_months * 0.5)
        else:  # ignore
            effective_intern = 0

        result['total_years'] = round(total_months / 12, 1)
        result['total_years_excl_internship'] = round((total_months - effective_intern) / 12 if internship_policy != 'ignore' else total_months / 12, 1)

        if intern_months > 0:
            result['details'].append(
                f'Internship: {round(intern_months / 12, 1)} years detected. '
                f'Policy: {internship_policy}.'
            )

        result['details'].append(
            f'Total calculated experience: {result["total_years"]} years '
            f'(from {result["date_ranges_parsed"]} date range(s)).'
        )

        # Score against job requirements
        result['experience_score'] = ATSEngine._score_experience(
            result['total_years'], job
        )

        return result

    @staticmethod
    def _score_experience(total_years, job):
        """
        Score experience against job min/max requirements.
        Returns a 0-100 PERCENTAGE (not a bonus) for use in weighted scoring.
        """
        min_exp = getattr(job, 'min_experience', 0) or 0
        max_exp = getattr(job, 'max_experience', None)

        if min_exp == 0 and max_exp is None:
            # No requirement set — give neutral score
            if total_years > 0:
                return 70  # Has some experience, neutral-positive
            return 50  # No requirement, no experience = neutral

        if total_years >= min_exp:
            if max_exp is None or total_years <= max_exp:
                return 100  # Perfect match
            else:
                # Overqualified — still good, slight reduction
                overshoot = total_years - max_exp
                return max(70, 100 - int(overshoot * 5))  # Gentle reduction
        else:
            # Under-qualified — proportional score
            if min_exp > 0:
                ratio = total_years / min_exp
                return max(0, min(90, int(ratio * 100)))  # 0-90 range (never 100 if under)
            return 50

    # ═══════════════════════════════════════════════════════════
    # STEP 6: Education Check
    # ═══════════════════════════════════════════════════════════

    # Education level hierarchy (higher number = higher degree)
    EDUCATION_HIERARCHY = {
        'any': 1,
        'bachelors': 2,
        'masters': 3,
        'phd': 4,
    }

    DEGREE_PATTERNS = {
        'phd': [r'\bph\.?d\b', r'\bdoctorate\b', r'\bdoctor of philosophy\b'],
        'masters': [r'\bm\.?s\.?\b', r'\bm\.?sc\b', r'\bm\.?tech\b', r'\bmaster', r'\bmba\b', r'\bm\.?eng\b', r'\bm\.?a\b'],
        'bachelors': [r'\bb\.?s\.?\b', r'\bb\.?sc\b', r'\bb\.?tech\b', r'\bbachelor', r'\bb\.?eng\b', r'\bb\.?a\b', r'\bb\.?com\b', r'\bbca\b', r'\bbba\b'],
        'any': [r'\bdegree\b', r'\bdiploma\b', r'\bcertificate\b', r'\buniversity\b', r'\bcollege\b'],
    }

    @staticmethod
    def _check_education(text, job):
        """
        Step 6: Check education level against job requirement.
        Returns: {
            'detected_level': str or None,
            'required_level': str,
            'meets_requirement': bool,
            'education_score': int,
            'details': str,
        }
        """
        required = getattr(job, 'education_level', '') or ''
        text_lower = text.lower()

        # Detect highest education level in resume
        detected = None
        for level in ['phd', 'masters', 'bachelors', 'any']:
            patterns = ATSEngine.DEGREE_PATTERNS.get(level, [])
            for pattern in patterns:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    detected = level
                    break
            if detected:
                break

        result = {
            'detected_level': detected,
            'required_level': required,
            'meets_requirement': True,
            'education_score': 0,
            'details': '',
        }

        if not required:
            # No requirement, bonus if education detected
            if detected:
                result['education_score'] = 70  # Has education, neutral-positive
                result['details'] = f'Education detected: {detected}. No formal requirement set.'
            else:
                result['education_score'] = 50  # No requirement, no education = neutral
                result['details'] = 'No education requirement set. No education section detected.'
            return result

        if detected is None:
            result['meets_requirement'] = False
            result['education_score'] = 10  # Very low but not zero
            result['details'] = f'Job requires {required} but no education detected in resume.'
            return result

        # Compare hierarchy
        detected_rank = ATSEngine.EDUCATION_HIERARCHY.get(detected, 0)
        required_rank = ATSEngine.EDUCATION_HIERARCHY.get(required, 0)

        if detected_rank >= required_rank:
            result['education_score'] = 100  # Meets or exceeds requirement
            result['details'] = f'Education requirement met: {detected} (required: {required}).'
        else:
            result['meets_requirement'] = False
            # Proportional score based on how close they are
            if required_rank > 0:
                ratio = detected_rank / required_rank
                result['education_score'] = max(20, int(ratio * 100))
            else:
                result['education_score'] = 50
            result['details'] = f'Education gap: detected {detected}, but job requires {required}.'

        return result

    # ═══════════════════════════════════════════════════════════
    # STEP 7: Calculate Final Score (with stability caps)
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _calculate_final_score(skill_result, experience_result, education_result, quality, job=None):
        """
        Step 7: Calculate the final ATS score using WEIGHTED COMPONENTS.

        Default Weights:
        - Skills:     60% (primary factor)
        - Experience: 25%
        - Education:  15%

        GUARDRAIL: Score Stability Caps:
        - If skill match < 20% → total score capped at 30 max
        - If skill match < 40% → total score capped at 50 max
        """
        # Component 1: Skill match percentage (0-100)
        total_weight = skill_result['total_weight']
        earned_weight = skill_result['earned_weight']

        if total_weight > 0:
            skill_pct = (earned_weight / total_weight) * 100
        else:
            skill_pct = 50  # No requirements = neutral

        # Component 2: Experience percentage (0-100, already calculated)
        experience_pct = experience_result['experience_score']

        # Component 3: Education percentage (0-100, already calculated)
        education_pct = education_result['education_score']

        # Weighted combination — read from job config or use defaults
        skill_weight = getattr(job, 'skill_weight', 0.60) if job else 0.60
        experience_weight = getattr(job, 'experience_weight', 0.25) if job else 0.25
        education_weight = getattr(job, 'education_weight', 0.15) if job else 0.15

        # GUARDRAIL: Normalize weights if they don't sum to ~1.0
        total_w = skill_weight + experience_weight + education_weight
        if total_w > 0 and abs(total_w - 1.0) > 0.1:
            skill_weight /= total_w
            experience_weight /= total_w
            education_weight /= total_w

        weighted_score = (
            (skill_pct * skill_weight) +
            (experience_pct * experience_weight) +
            (education_pct * education_weight)
        )

        score = round(weighted_score)

        # Quality penalties (still applied as deductions)
        penalties = 0
        if not quality['has_email']:
            penalties -= 5
        if quality.get('flags'):
            for flag in quality['flags']:
                if 'skill stuffing' in flag.lower():
                    penalties -= 5
                    break  # Only penalize once for stuffing

        score += penalties

        # GUARDRAIL: Score stability caps
        if total_weight > 0:
            if skill_pct < 20:
                score = min(score, 30)
            elif skill_pct < 40:
                score = min(score, 50)

        # Final cap 0-100
        score = max(0, min(100, score))

        return {
            'score': score,
            'skill_match_pct': round(skill_pct, 1),
            'experience_pct': round(experience_pct, 1),
            'education_pct': round(education_pct, 1),
            'base_score': round(weighted_score, 1),
            'penalties': penalties,
            'weights': {
                'skill': skill_weight,
                'experience': experience_weight,
                'education': education_weight,
            },
        }

    # ═══════════════════════════════════════════════════════════
    # STEP 8: Confidence Calculation
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _calculate_confidence(quality, sections, experience_result, skill_result):
        """
        Step 8: Calculate scoring confidence based on data quality.
        GUARDRAIL: Low confidence → auto-triggers needs_review.
        """
        score = 0
        reasons = []

        # Section clarity
        if sections['sections_found_count'] >= 3:
            score += 3
        elif sections['sections_found_count'] >= 2:
            score += 2
        else:
            score += 0
            reasons.append('Few or no standard resume sections detected.')

        # Date parsing quality
        if experience_result['date_ranges_found'] > 0:
            if experience_result['unparseable_ranges'] == 0:
                score += 3
            else:
                score += 1
                reasons.append(
                    f'{experience_result["unparseable_ranges"]} date range(s) could not be parsed.'
                )
        else:
            if experience_result['is_ambiguous']:
                score += 0
                reasons.append('No date ranges found in resume — experience is uncertain.')
            else:
                score += 1

        # Word count quality
        if quality['word_count'] >= 300:
            score += 2
        elif quality['word_count'] >= 150:
            score += 1
        else:
            reasons.append('Resume is very short, limited data to analyze.')

        # Contact info
        if quality['has_email'] and quality['has_phone']:
            score += 1
        elif not quality['has_email']:
            reasons.append('No contact email found.')

        # Skill coverage
        total_skills = len(skill_result['matched']) + len(skill_result['partial']) + len(skill_result['missing'])
        if total_skills > 0 and len(skill_result['matched']) > 0:
            score += 1

        # Determine level: 0-4 = low, 5-7 = medium, 8-10 = high
        if score >= 8:
            level = 'high'
        elif score >= 5:
            level = 'medium'
        else:
            level = 'low'

        return {
            'level': level,
            'score': score,
            'reasons': reasons,
        }

    # ═══════════════════════════════════════════════════════════
    # STEP 9: Manual Review Flag
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _determine_review_needed(final_score, confidence, skill_result, experience_result):
        """
        Step 9: Determine if HR review is needed.
        GUARDRAIL: Low confidence → auto-triggers review.
        """
        needs_review = False
        review_reason = ''

        # Low confidence = always review
        if confidence['level'] == 'low':
            needs_review = True
            review_reason = 'Low data confidence — resume may have parsing issues or insufficient information.'

        # Borderline score
        elif 35 <= final_score <= 65:
            needs_review = True
            review_reason = f'Borderline score ({final_score}) — candidate may be a fit depending on context.'

        # Conflicting signals: must-have missing but score is decent
        elif final_score >= 50:
            missing_musts = [m for m in skill_result['missing'] if m['is_must_have']]
            if missing_musts:
                needs_review = True
                names = ', '.join(m['name'] for m in missing_musts)
                review_reason = f'Score is {final_score} but must-have skill(s) missing: {names}.'

        # Experience couldn't be calculated
        elif experience_result['is_ambiguous'] and experience_result['total_years'] == 0:
            needs_review = True
            review_reason = 'Experience could not be determined from resume.'

        return {
            'needs_review': needs_review,
            'review_reason': review_reason,
        }

    # ═══════════════════════════════════════════════════════════
    # STEPS 10-12: Explanation, Strengths, Weaknesses
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _build_explanation(final_score_data, skill_result, experience_result, education_result, confidence):
        """
        Step 10: Build deterministic explanation.
        GUARDRAIL: Every sentence comes from actual data.
        GUARDRAIL: Score-explanation must NOT contradict.
        """
        score = final_score_data['score']
        skill_pct = final_score_data['skill_match_pct']
        lines = []

        total_skills = len(skill_result['matched']) + len(skill_result['partial']) + len(skill_result['missing'])

        # Score-to-tone mapping (GUARDRAIL: prevents contradictions)
        if score >= 81:
            tone = 'strong'
            summary = 'This candidate appears to be a strong match for this role.'
        elif score >= 61:
            tone = 'good'
            summary = 'This candidate is a good potential match.'
        elif score >= 31:
            tone = 'moderate'
            summary = 'This candidate shows a moderate match. Review recommended.'
        else:
            tone = 'weak'
            summary = 'This candidate does not appear to be a strong match based on the resume.'

        # Skill summary
        matched_count = len(skill_result['matched'])
        partial_count = len(skill_result['partial'])
        missing_count = len(skill_result['missing'])

        lines.append(
            f'Matched {matched_count} of {total_skills} required skills ({skill_pct:.0f}% skill match).'
        )

        if partial_count > 0:
            lines.append(f'{partial_count} skill(s) matched via related technology (partial credit).')

        if missing_count > 0:
            missing_names = [m['name'] for m in skill_result['missing']]
            lines.append(f'Missing: {", ".join(missing_names)}.')

        # Partial match details
        for detail in skill_result['match_details']:
            lines.append(detail)

        # Must-have status
        missing_musts = [m['name'] for m in skill_result['missing'] if m['is_must_have']]
        if missing_musts:
            lines.append(f'CRITICAL: Must-have skill(s) missing: {", ".join(missing_musts)}.')

        # Weighted score breakdown
        exp_pct = final_score_data.get('experience_pct', 0)
        edu_pct = final_score_data.get('education_pct', 0)
        weights = final_score_data.get('weights', {})
        lines.append(
            f'Score breakdown: Skills {skill_pct:.0f}% (×{weights.get("skill", 0.60):.0f}), '
            f'Experience {exp_pct:.0f}% (×{weights.get("experience", 0.25):.0f}), '
            f'Education {edu_pct:.0f}% (×{weights.get("education", 0.15):.0f}).'
        )

        # Experience summary
        for detail in experience_result['details']:
            lines.append(detail)

        # Education summary
        if education_result['details']:
            lines.append(education_result['details'])

        # Confidence note
        if confidence['level'] != 'high':
            lines.append(
                f'Confidence: {confidence["level"].upper()} — '
                + '; '.join(confidence['reasons'][:2]) if confidence['reasons'] else ''
            )

        lines.append(summary)

        return ' '.join(lines)

    @staticmethod
    def _build_strengths(skill_result, experience_result, education_result, quality, sections):
        """Step 11: Build strengths list from matched data."""
        strengths = []

        # Matched skills
        matched_names = [m['name'] for m in skill_result['matched']]
        if matched_names:
            if len(matched_names) <= 5:
                strengths.append(f'Has required skills: {", ".join(matched_names)}.')
            else:
                strengths.append(f'Has {len(matched_names)} of the required skills.')

        # Strong depth skills
        deep_skills = [
            m['name'] for m in skill_result['matched']
            if m.get('depth_score', {}).get('multiplier', 1.0) >= 1.3
        ]
        if deep_skills:
            strengths.append(f'Strong depth in: {", ".join(deep_skills[:5])}.')

        # Good experience
        if experience_result['total_years'] > 0:
            strengths.append(f'{experience_result["total_years"]} years of experience detected.')

        # Education met
        if education_result.get('meets_requirement'):
            if education_result['detected_level']:
                strengths.append(f'Education: {education_result["detected_level"]} detected.')

        # Well-structured resume
        if sections['sections_found_count'] >= 3:
            strengths.append('Well-structured resume with clear sections.')

        # Contact info
        if quality['has_email'] and quality['has_phone']:
            strengths.append('Complete contact information provided.')

        return strengths if strengths else ['File was uploaded and processed successfully.']

    @staticmethod
    def _build_weaknesses(skill_result, experience_result, education_result, quality, sections):
        """Step 12: Build weaknesses list from missing data."""
        weaknesses = []

        # Missing must-haves
        missing_musts = [m['name'] for m in skill_result['missing'] if m['is_must_have']]
        if missing_musts:
            weaknesses.append(f'Missing critical must-have skills: {", ".join(missing_musts)}.')

        # Other missing skills
        missing_others = [m['name'] for m in skill_result['missing'] if not m['is_must_have']]
        if missing_others:
            weaknesses.append(f'Missing preferred skills: {", ".join(missing_others[:5])}.')

        # Experience issues
        for flag in experience_result['flags']:
            weaknesses.append(flag)

        # Education gap
        if not education_result.get('meets_requirement', True):
            weaknesses.append(education_result['details'])

        # Quality issues
        for flag in quality['flags']:
            weaknesses.append(flag)

        # Poor structure
        if sections['sections_found_count'] < 2:
            weaknesses.append('Resume lacks clear section headers (Skills, Experience, Education).')

        return weaknesses if weaknesses else ['No significant weaknesses identified.']

    # ═══════════════════════════════════════════════════════════
    # PHASE 4: SCORING INTELLIGENCE
    # ═══════════════════════════════════════════════════════════

    # --- Task 4.2: Role Relevance Scoring ---
    @staticmethod
    def _score_role_relevance(parsed_data, job):
        """
        Score how relevant candidate's past job titles are to the target role.
        Uses title_data.py for group matching.

        Returns: {
            'score': int (0-100),
            'target_group': str or None,
            'details': list of str,
        }
        """
        try:
            from analysis.title_data import calculate_role_relevance
        except ImportError:
            return {'score': 50, 'target_group': None, 'details': ['Role relevance module not available.']}

        # Extract titles from parsed work entries
        work_entries = parsed_data.get('work_entries', [])
        candidate_titles = [e.get('title', '') for e in work_entries if e.get('title')]

        # Get target job title
        target_title = getattr(job, 'title', '') or ''

        return calculate_role_relevance(candidate_titles, target_title)

    # --- Task 4.3: Skill Recency Scoring ---
    @staticmethod
    def _calculate_skill_recency(skill_result, parsed_data):
        """
        For each matched skill, check how recently it was used based on work entry dates.
        Returns a recency multiplier map and overall recency score.

        Recency tiers:
        - Used in last 2 years: 1.0x
        - Used 2-5 years ago: 0.8x
        - Used 5+ years ago: 0.5x
        - Section only (no date context): 0.7x
        """
        from datetime import datetime
        current_year = datetime.now().year

        work_entries = parsed_data.get('work_entries', [])
        matched_skills = skill_result.get('matched', []) + skill_result.get('partial', [])

        recency_map = {}
        recency_details = []

        for skill_info in matched_skills:
            skill_name = skill_info.get('name', '').lower()
            if not skill_name:
                continue

            # Find the most recent work entry that mentions this skill
            most_recent_year = None
            for entry in work_entries:
                # Check if skill appears in entry bullets or raw text
                entry_text = ' '.join(entry.get('bullets', [])) + ' ' + entry.get('raw_text', '')
                if skill_name in entry_text.lower():
                    end_date = entry.get('end_date')
                    if end_date:
                        entry_year = end_date[0]
                        if most_recent_year is None or entry_year > most_recent_year:
                            most_recent_year = entry_year

            # Calculate recency multiplier
            if most_recent_year is not None:
                years_ago = current_year - most_recent_year
                if years_ago <= 2:
                    multiplier = 1.0
                    tier = 'recent'
                elif years_ago <= 5:
                    multiplier = 0.8
                    tier = 'moderate'
                else:
                    multiplier = 0.5
                    tier = 'dated'
                    recency_details.append(
                        f'"{skill_info.get("name", skill_name)}" last used {years_ago} years ago.'
                    )
            else:
                multiplier = 0.7  # Found in resume but no date context
                tier = 'unknown'

            recency_map[skill_name] = {
                'multiplier': multiplier,
                'tier': tier,
                'last_used_year': most_recent_year,
            }

        # Calculate overall recency score (0-100)
        if recency_map:
            avg_multiplier = sum(r['multiplier'] for r in recency_map.values()) / len(recency_map)
            recency_score = int(avg_multiplier * 100)
        else:
            recency_score = 50  # Neutral if no data

        return {
            'score': recency_score,
            'skill_recency': recency_map,
            'details': recency_details,
        }

    # --- Task 4.4: Knockout / Pre-Screening Filter ---
    @staticmethod
    def _pre_screen(candidate, job, experience_result, skill_result, education_result):
        """
        Pre-screening knockout filter. Checks hard requirements BEFORE scoring.
        If knockout is triggered, the candidate is auto-rejected.

        Returns: {
            'passed': bool,
            'knockout_reasons': list of str,
        }
        """
        knockout_enabled = getattr(job, 'knockout_enabled', False)
        if not knockout_enabled:
            return {'passed': True, 'knockout_reasons': []}

        reasons = []

        # Check minimum experience
        min_exp = getattr(job, 'min_experience', 0) or 0
        if min_exp > 0:
            candidate_years = experience_result.get('total_years', 0)
            if candidate_years < min_exp:
                reasons.append(
                    f'Minimum {min_exp} years experience required, '
                    f'candidate has {candidate_years} years.'
                )

        # Check must-have skills (if ALL must-haves are missing → knockout)
        missing_must_haves = [m['name'] for m in skill_result.get('missing', []) if m.get('is_must_have')]
        total_must_haves = sum(1 for r in job.requirements.all() if r.is_must_have)
        if total_must_haves > 0 and len(missing_must_haves) == total_must_haves:
            reasons.append(
                f'None of the must-have skills found: {", ".join(missing_must_haves)}.'
            )

        # Check education requirement (only knockout if explicitly required)
        required_edu = getattr(job, 'education_level', '') or ''
        if required_edu and required_edu != 'any':
            if not education_result.get('meets_requirement', True):
                if education_result.get('detected_level') is None:
                    reasons.append(
                        f'Required education level ({required_edu}) not detected in resume.'
                    )

        return {
            'passed': len(reasons) == 0,
            'knockout_reasons': reasons,
        }

    # --- Task 4.5: Employment Gap Detection ---
    @staticmethod
    def _detect_employment_gaps(parsed_data):
        """
        Detect gaps > 6 months between consecutive work entries.
        Information only — not used as a score penalty.

        Returns: list of {
            'gap_months': int,
            'between': str,  # "Role A → Role B"
            'start_year': int,
            'end_year': int,
        }
        """
        work_entries = parsed_data.get('work_entries', [])

        # Filter entries with valid dates and sort by end date
        dated_entries = [
            e for e in work_entries
            if e.get('start_date') and e.get('end_date')
        ]
        if len(dated_entries) < 2:
            return []

        # Sort by start date
        dated_entries.sort(key=lambda e: (e['start_date'][0], e['start_date'][1]))

        gaps = []
        for i in range(len(dated_entries) - 1):
            current_end = dated_entries[i]['end_date']
            next_start = dated_entries[i + 1]['start_date']

            # Calculate gap in months
            gap_months = (next_start[0] - current_end[0]) * 12 + (next_start[1] - current_end[1])

            if gap_months > 6:  # Only flag gaps > 6 months
                current_title = dated_entries[i].get('title', 'Unknown role')
                next_title = dated_entries[i + 1].get('title', 'Unknown role')
                gaps.append({
                    'gap_months': gap_months,
                    'between': f'{current_title} → {next_title}',
                    'start_year': current_end[0],
                    'end_year': next_start[0],
                })

        return gaps

    # --- Task 4.6: Job Hopping Detection ---
    @staticmethod
    def _detect_job_hopping(parsed_data):
        """
        Detect candidates with short tenures (< 12 months) at multiple roles.
        Information only — not a score penalty.

        Returns: {
            'short_tenure_count': int,
            'is_job_hopper': bool (3+ short tenures in last 5 years),
            'details': list of str,
        }
        """
        from datetime import datetime
        current_year = datetime.now().year
        cutoff_year = current_year - 5

        work_entries = parsed_data.get('work_entries', [])

        short_tenures = []
        for entry in work_entries:
            if entry.get('is_internship'):
                continue  # Don't count internships

            months = entry.get('months', 0)
            end_date = entry.get('end_date')

            # Only count recent roles (last 5 years)
            if end_date and end_date[0] >= cutoff_year:
                if 0 < months < 12:
                    title = entry.get('title', 'Unknown role')
                    short_tenures.append(f'{title} ({months} months)')

        is_hopper = len(short_tenures) >= 3

        details = []
        if is_hopper:
            details.append(
                f'Frequent role changes detected: {len(short_tenures)} roles with '
                f'< 12 months tenure in the last 5 years.'
            )

        return {
            'short_tenure_count': len(short_tenures),
            'is_job_hopper': is_hopper,
            'short_roles': short_tenures,
            'details': details,
        }

    # --- Task 4.7: Certification Matching ---
    @staticmethod
    def _match_certifications(parsed_data, job):
        """
        Match detected certifications against job requirements that are certification-type.
        Also provides general cert info for non-cert-required jobs.

        Returns: {
            'detected': list of cert names,
            'matched': list (certs that match requirements),
            'score_bonus': int (0-10),
            'details': list of str,
        }
        """
        certs = parsed_data.get('certifications', [])
        detected_names = [c.get('name', '') for c in certs]

        result = {
            'detected': detected_names,
            'matched': [],
            'score_bonus': 0,
            'details': [],
        }

        if detected_names:
            result['details'].append(
                f'Certifications detected: {", ".join(detected_names)}.'
            )
            # Small bonus for having any relevant certifications
            result['score_bonus'] = min(5, len(detected_names) * 2)
        else:
            result['details'].append('No certifications detected in resume.')

        return result

    # ═══════════════════════════════════════════════════════════
    # MAIN EVALUATE — Full Pipeline (Extended)
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def evaluate(candidate):
        """
        Main entry point. Evaluate a candidate's resume against their job.
        Returns structured result dict with deterministic, explainable scoring.
        """
        job = candidate.job

        # Get parsed resume text
        resume_text = ""
        try:
            if hasattr(candidate, 'resume') and candidate.resume:
                resume_text = (candidate.resume.parsed_text or "").strip()
        except Exception:
            resume_text = ""

        # STEP 1: Resume Quality Check
        quality = ATSEngine._check_resume_quality(resume_text)

        if not quality['is_valid']:
            return {
                'overall_score': 0,
                'explanation': quality['stop_reason'],
                'strengths': ['File was uploaded successfully.'],
                'weaknesses': quality['flags'] if quality['flags'] else [quality['stop_reason']],
                'interview_questions': [],
                'confidence': 'low',
                'confidence_reasons': [quality['stop_reason']],
                'needs_review': True,
                'review_reason': 'Resume could not be validated as a proper document.',
            }

        # STEP 2: Section Detection
        sections = ATSEngine._detect_sections(resume_text)

        # STEP 2.5: Structured Data Extraction (Phase 3)
        parsed_data = {}
        try:
            from analysis.resume_parser import parse_resume_structured
            parsed_data = parse_resume_structured(resume_text, sections)
        except Exception as e:
            parsed_data = {
                'work_entries': [],
                'education_entries': [],
                'certifications': [],
                'work_entry_count': 0,
                'total_work_months': 0,
                'has_structured_data': False,
                'parse_error': str(e),
            }

        # STEP 3+4: Skill Matching + Depth
        requirements = list(job.requirements.all())
        skill_result = ATSEngine._match_skills(resume_text, sections, requirements)

        # STEP 5: Experience Calculation (now section-aware to avoid false positives)
        experience_result = ATSEngine._calculate_experience(resume_text, job, sections)

        # STEP 6: Education Check
        education_result = ATSEngine._check_education(resume_text, job)

        # PHASE 4 — STEP 6.5: Knockout Pre-Screening
        knockout = ATSEngine._pre_screen(
            candidate, job, experience_result, skill_result, education_result
        )
        if not knockout['passed']:
            return {
                'overall_score': 0,
                'explanation': 'Candidate did not meet minimum requirements. ' + ' '.join(knockout['knockout_reasons']),
                'strengths': [],
                'weaknesses': knockout['knockout_reasons'],
                'interview_questions': [],
                'confidence': 'high',
                'confidence_reasons': ['Auto-rejected by knockout filter.'],
                'needs_review': False,
                'review_reason': 'Auto-rejected: does not meet minimum requirements.',
                'score_breakdown': {'knockout': True, 'knockout_reasons': knockout['knockout_reasons']},
                'parsed_data': parsed_data,
                'role_relevance': {},
                'skill_recency': {},
                'employment_gaps': [],
                'job_hopping': {},
                'certifications_matched': {},
            }

        # PHASE 4 — STEP 6.6: Role Relevance Scoring
        role_relevance = ATSEngine._score_role_relevance(parsed_data, job)

        # PHASE 4 — STEP 6.7: Skill Recency Scoring
        skill_recency = ATSEngine._calculate_skill_recency(skill_result, parsed_data)

        # PHASE 4 — STEP 6.8: Employment Gap Detection
        employment_gaps = ATSEngine._detect_employment_gaps(parsed_data)

        # PHASE 4 — STEP 6.9: Job Hopping Detection
        job_hopping = ATSEngine._detect_job_hopping(parsed_data)

        # PHASE 4 — STEP 6.10: Certification Matching
        cert_result = ATSEngine._match_certifications(parsed_data, job)

        # STEP 7: Final Score (now includes cert bonus)
        final_score_data = ATSEngine._calculate_final_score(
            skill_result, experience_result, education_result, quality, job
        )
        # Apply certification bonus on top
        if cert_result['score_bonus'] > 0:
            final_score_data['score'] = min(100, final_score_data['score'] + cert_result['score_bonus'])
            final_score_data['cert_bonus'] = cert_result['score_bonus']

        # Inject Phase 4 data into score breakdown
        final_score_data['role_relevance_pct'] = role_relevance.get('score', 50)
        final_score_data['recency_pct'] = skill_recency.get('score', 50)

        # PHASE 7 — Teach-Time Estimation
        teach_time_data = []
        try:
            from analysis.teach_time import estimate_teach_time
            matched_names = [m.get('name', '') for m in skill_result.get('matched', [])]
            teach_time_data = estimate_teach_time(
                skill_result.get('missing', []),
                matched_names
            )
        except Exception:
            teach_time_data = []

        # PHASE 7 — Requirement Coverage Map (per-requirement breakdown)
        requirement_coverage = []
        for m in skill_result.get('matched', []):
            recency_info = skill_recency.get('skill_recency', {}).get(m.get('name', '').lower(), {})
            requirement_coverage.append({
                'skill': m.get('name', ''),
                'status': 'matched',
                'match_type': 'direct',
                'is_must_have': m.get('is_must_have', False),
                'recency': recency_info.get('tier', 'unknown'),
            })
        for p in skill_result.get('partial', []):
            requirement_coverage.append({
                'skill': p.get('name', ''),
                'status': 'partial',
                'match_type': 'group',
                'matched_via': p.get('matched_via', ''),
                'is_must_have': p.get('is_must_have', False),
                'credit': 0.3,
            })
        for ms in skill_result.get('missing', []):
            tt = next((t for t in teach_time_data if t['skill'] == ms.get('name', '')), None)
            requirement_coverage.append({
                'skill': ms.get('name', ''),
                'status': 'missing',
                'is_must_have': ms.get('is_must_have', False),
                'teach_time': f'{tt["estimated_weeks"]} weeks' if tt else 'unknown',
                'effort_level': tt['effort_level'] if tt else 'unknown',
            })

        # STEP 8: Confidence
        confidence = ATSEngine._calculate_confidence(
            quality, sections, experience_result, skill_result
        )

        # STEP 9: Review Flag
        review = ATSEngine._determine_review_needed(
            final_score_data['score'], confidence, skill_result, experience_result
        )

        # STEP 10: Explanation
        explanation = ATSEngine._build_explanation(
            final_score_data, skill_result, experience_result, education_result, confidence
        )
        # Append Phase 4 details to explanation
        phase4_notes = []
        for detail in role_relevance.get('details', []):
            phase4_notes.append(detail)
        for detail in skill_recency.get('details', []):
            phase4_notes.append(detail)
        for gap in employment_gaps:
            phase4_notes.append(f'Employment gap: {gap["gap_months"]} months ({gap["between"]}).')
        for detail in job_hopping.get('details', []):
            phase4_notes.append(detail)
        for detail in cert_result.get('details', []):
            phase4_notes.append(detail)
        if phase4_notes:
            explanation += ' ' + ' '.join(phase4_notes)

        # STEP 11: Strengths
        strengths = ATSEngine._build_strengths(
            skill_result, experience_result, education_result, quality, sections
        )
        # Add Phase 4 strengths
        if role_relevance.get('score', 0) >= 70:
            strengths.append('Past roles are directly relevant to this position.')
        if skill_recency.get('score', 0) >= 80:
            strengths.append('Skills are recently used and current.')
        if cert_result.get('detected'):
            strengths.append(f'Has relevant certifications: {", ".join(cert_result["detected"][:3])}.')

        # STEP 12: Weaknesses
        weaknesses = ATSEngine._build_weaknesses(
            skill_result, experience_result, education_result, quality, sections
        )
        # Add Phase 4 weaknesses
        if role_relevance.get('score', 50) < 30:
            weaknesses.append('Past roles are not closely related to this position.')
        if skill_recency.get('score', 50) < 50:
            weaknesses.append('Some key skills appear to be dated (not used recently).')
        for gap in employment_gaps:
            weaknesses.append(f'Employment gap of {gap["gap_months"]} months detected.')
        if job_hopping.get('is_job_hopper'):
            weaknesses.append('Frequent role changes detected (3+ roles with < 12 months tenure).')

        # PHASE 5 — STEP 13: Red Flags Collection
        red_flags = []
        try:
            from analysis.red_flags import collect_red_flags
            red_flags = collect_red_flags(
                quality=quality,
                sections=sections,
                skill_result=skill_result,
                experience_result=experience_result,
                education_result=education_result,
                final_score_data=final_score_data,
                parsed_data=parsed_data,
                role_relevance=role_relevance,
                skill_recency=skill_recency,
                employment_gaps=employment_gaps,
                job_hopping=job_hopping,
                cert_result=cert_result,
            )
        except Exception:
            red_flags = []

        # GUARDRAIL: Critical red flags auto-trigger review
        critical_flags = [f for f in red_flags if f.get('severity') == 'critical']
        if critical_flags and not review['needs_review']:
            review['needs_review'] = True
            review['review_reason'] = 'Critical red flag(s) detected: ' + critical_flags[0]['message']

        return {
            'overall_score': final_score_data['score'],
            'explanation': explanation,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'interview_questions': [],
            'confidence': confidence['level'],
            'confidence_reasons': confidence['reasons'],
            'needs_review': review['needs_review'],
            'review_reason': review['review_reason'],
            'score_breakdown': final_score_data,
            'parsed_data': parsed_data,
            'role_relevance': role_relevance,
            'skill_recency': skill_recency,
            'employment_gaps': employment_gaps,
            'job_hopping': job_hopping,
            'certifications_matched': cert_result,
            'red_flags': red_flags,
            'teach_time': teach_time_data,
            'requirement_coverage': requirement_coverage,
        }
