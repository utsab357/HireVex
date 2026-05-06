"""
Job Title Database — Title groups, seniority detection, and role relevance matching.
Used by the ATS engine to score how relevant a candidate's past roles are to the target job.

NO AI/ML — Pure dictionary-based matching.
"""

# ═══════════════════════════════════════════════════════════
# JOB TITLE GROUPS
# Maps role categories to common title variations.
# Used for determining if a candidate's past roles are in the
# same or adjacent domain as the target job.
# ═══════════════════════════════════════════════════════════

JOB_TITLE_GROUPS = {
    'frontend': [
        'frontend developer', 'front-end developer', 'front end developer',
        'ui developer', 'ui engineer', 'react developer', 'angular developer',
        'vue developer', 'frontend engineer', 'front-end engineer',
        'web developer', 'javascript developer', 'ui/ux developer',
    ],
    'backend': [
        'backend developer', 'back-end developer', 'back end developer',
        'server-side developer', 'api developer', 'backend engineer',
        'back-end engineer', 'python developer', 'java developer',
        'node.js developer', 'node developer', 'golang developer',
        'ruby developer', 'php developer', '.net developer',
    ],
    'fullstack': [
        'full stack developer', 'fullstack developer', 'full-stack developer',
        'full stack engineer', 'fullstack engineer', 'software developer',
        'software engineer', 'application developer', 'web application developer',
        'mern developer', 'mean developer',
    ],
    'devops': [
        'devops engineer', 'devops developer', 'site reliability engineer',
        'sre', 'platform engineer', 'infrastructure engineer',
        'cloud engineer', 'systems engineer', 'release engineer',
        'build engineer', 'deployment engineer',
    ],
    'data_engineering': [
        'data engineer', 'etl developer', 'data pipeline engineer',
        'big data engineer', 'data infrastructure engineer',
        'analytics engineer', 'data platform engineer',
    ],
    'data_science': [
        'data scientist', 'machine learning engineer', 'ml engineer',
        'ai engineer', 'research scientist', 'applied scientist',
        'deep learning engineer', 'nlp engineer',
    ],
    'data_analytics': [
        'data analyst', 'business analyst', 'business intelligence analyst',
        'bi analyst', 'bi developer', 'reporting analyst',
        'analytics manager', 'insights analyst',
    ],
    'mobile': [
        'mobile developer', 'ios developer', 'android developer',
        'react native developer', 'flutter developer', 'mobile engineer',
        'mobile application developer', 'swift developer', 'kotlin developer',
    ],
    'qa_testing': [
        'qa engineer', 'quality assurance engineer', 'test engineer',
        'sdet', 'software test engineer', 'automation engineer',
        'qa analyst', 'test automation engineer', 'quality engineer',
    ],
    'security': [
        'security engineer', 'cybersecurity engineer', 'information security',
        'security analyst', 'penetration tester', 'security consultant',
        'appsec engineer', 'security architect',
    ],
    'product': [
        'product manager', 'product owner', 'technical product manager',
        'senior product manager', 'associate product manager',
        'product lead', 'product director',
    ],
    'design': [
        'ui designer', 'ux designer', 'ui/ux designer', 'product designer',
        'interaction designer', 'visual designer', 'graphic designer',
        'design lead', 'senior designer',
    ],
    'project_management': [
        'project manager', 'technical project manager', 'program manager',
        'scrum master', 'agile coach', 'delivery manager',
        'engineering manager', 'technical lead',
    ],
    'database': [
        'database administrator', 'dba', 'database engineer',
        'database developer', 'sql developer',
    ],
    'network': [
        'network engineer', 'network administrator', 'system administrator',
        'sysadmin', 'it administrator', 'it support engineer',
        'network architect', 'it engineer',
    ],
}

# Adjacent groups — groups that are closely related and share transferable skills
ADJACENT_GROUPS = {
    'frontend': ['fullstack', 'design', 'mobile'],
    'backend': ['fullstack', 'devops', 'data_engineering', 'database'],
    'fullstack': ['frontend', 'backend', 'mobile'],
    'devops': ['backend', 'security', 'network', 'data_engineering'],
    'data_engineering': ['backend', 'data_science', 'data_analytics', 'devops', 'database'],
    'data_science': ['data_engineering', 'data_analytics'],
    'data_analytics': ['data_science', 'data_engineering', 'product'],
    'mobile': ['frontend', 'fullstack'],
    'qa_testing': ['backend', 'frontend', 'fullstack', 'devops'],
    'security': ['devops', 'network', 'backend'],
    'product': ['project_management', 'design', 'data_analytics'],
    'design': ['frontend', 'product'],
    'project_management': ['product'],
    'database': ['backend', 'data_engineering'],
    'network': ['devops', 'security'],
}


# ═══════════════════════════════════════════════════════════
# SENIORITY DETECTION
# ═══════════════════════════════════════════════════════════

SENIORITY_KEYWORDS = {
    # (keyword, level)  —  higher number = more senior
    'intern': 0,
    'trainee': 0,
    'apprentice': 0,
    'fresher': 0,
    'junior': 1,
    'jr': 1,
    'associate': 1,
    'entry level': 1,
    'entry-level': 1,
    'mid': 2,
    'mid-level': 2,
    'mid level': 2,
    'senior': 3,
    'sr': 3,
    'lead': 4,
    'tech lead': 4,
    'team lead': 4,
    'principal': 5,
    'staff': 5,
    'distinguished': 5,
    'architect': 4,
    'manager': 4,
    'engineering manager': 4,
    'director': 5,
    'head of': 5,
    'head': 5,
    'vp': 6,
    'vice president': 6,
    'cto': 7,
    'ceo': 7,
    'co-founder': 6,
    'founder': 7,
}


def detect_title_group(title_text):
    """
    Detect which job title group a title belongs to.
    Returns: group name (str) or None if no match.
    """
    if not title_text:
        return None

    title_lower = title_text.lower().strip()

    # Check each group's titles
    best_match = None
    best_match_len = 0

    for group, titles in JOB_TITLE_GROUPS.items():
        for known_title in titles:
            if known_title in title_lower or title_lower in known_title:
                # Prefer longer matches (more specific)
                if len(known_title) > best_match_len:
                    best_match = group
                    best_match_len = len(known_title)

    return best_match


def detect_seniority(title_text):
    """
    Detect seniority level from a job title.
    Returns: int (0-7) where 0=intern, 7=C-level.
    Default: 2 (mid-level) if no seniority keyword found.
    """
    if not title_text:
        return 2  # Default to mid

    title_lower = title_text.lower().strip()

    # Check for seniority keywords (longest match first)
    detected_level = None
    for keyword, level in sorted(SENIORITY_KEYWORDS.items(), key=lambda x: len(x[0]), reverse=True):
        if keyword in title_lower:
            detected_level = level
            break

    return detected_level if detected_level is not None else 2  # Default mid


def calculate_role_relevance(candidate_titles, target_job_title):
    """
    Calculate how relevant a candidate's past roles are to the target job.

    Args:
        candidate_titles: list of title strings from work entries
        target_job_title: the job title being applied for

    Returns: {
        'score': int (0-100),
        'target_group': str or None,
        'matched_groups': list,
        'details': list of str,
    }
    """
    target_group = detect_title_group(target_job_title)

    result = {
        'score': 50,  # Default neutral if we can't determine
        'target_group': target_group,
        'matched_groups': [],
        'details': [],
    }

    if not target_group:
        result['details'].append(f'Could not classify target role "{target_job_title}" into a known group.')
        return result

    if not candidate_titles:
        result['score'] = 30
        result['details'].append('No past job titles detected in resume.')
        return result

    # Classify each candidate title
    direct_matches = 0
    adjacent_matches = 0
    unrelated = 0

    for title in candidate_titles:
        cand_group = detect_title_group(title)
        if cand_group:
            result['matched_groups'].append(cand_group)

            if cand_group == target_group:
                direct_matches += 1
            elif cand_group in ADJACENT_GROUPS.get(target_group, []):
                adjacent_matches += 1
            else:
                unrelated += 1
        else:
            unrelated += 1

    total = direct_matches + adjacent_matches + unrelated
    if total == 0:
        return result

    # Score calculation
    if direct_matches > 0:
        # At least one role in the same domain
        direct_ratio = direct_matches / total
        result['score'] = min(100, 70 + int(direct_ratio * 30))
        result['details'].append(
            f'{direct_matches} of {total} past role(s) are in the same domain ({target_group}).'
        )
    elif adjacent_matches > 0:
        # Related domain experience
        adjacent_ratio = adjacent_matches / total
        result['score'] = min(80, 40 + int(adjacent_ratio * 40))
        adj_groups = list(set(g for g in result['matched_groups'] if g in ADJACENT_GROUPS.get(target_group, [])))
        result['details'].append(
            f'No direct {target_group} experience, but has related experience in: {", ".join(adj_groups)}.'
        )
    else:
        # No relevant experience
        result['score'] = 15
        detected_groups = list(set(result['matched_groups']))
        if detected_groups:
            result['details'].append(
                f'Past roles ({", ".join(detected_groups)}) are not related to {target_group}.'
            )
        else:
            result['details'].append('Past roles could not be classified.')

    return result
