"""
Red Flags Engine — Dedicated recruiter intelligence layer.
Collects and categorizes warnings from all scoring steps.

These are INFORMATION ONLY — they do NOT affect scores.
The recruiter decides what to do with them.

Categories:
- career: job hopping, gaps, experience inconsistencies
- resume: formatting issues, skill stuffing, missing info
- consistency: claims vs evidence mismatches
- scoring: score anomalies, partial credit dominance

Severity levels:
- info: Nice to know
- warning: Recruiter should be aware
- critical: Requires attention before proceeding
"""


def collect_red_flags(
    quality,
    sections,
    skill_result,
    experience_result,
    education_result,
    final_score_data,
    parsed_data,
    role_relevance,
    skill_recency,
    employment_gaps,
    job_hopping,
    cert_result,
):
    """
    Main entry point — collects all red flags from scoring data.

    Returns: list of {
        'category': str,
        'severity': str ('info', 'warning', 'critical'),
        'message': str,
    }
    """
    flags = []

    # ── CAREER FLAGS ──────────────────────────────────────
    _check_career_flags(flags, employment_gaps, job_hopping, experience_result, parsed_data)

    # ── RESUME FLAGS ──────────────────────────────────────
    _check_resume_flags(flags, quality, sections, parsed_data)

    # ── CONSISTENCY FLAGS ─────────────────────────────────
    _check_consistency_flags(flags, experience_result, skill_result, parsed_data)

    # ── SCORING FLAGS ─────────────────────────────────────
    _check_scoring_flags(flags, final_score_data, skill_result, role_relevance, skill_recency)

    return flags


def _check_career_flags(flags, employment_gaps, job_hopping, experience_result, parsed_data):
    """Career-related red flags."""

    # Job hopping
    if job_hopping.get('is_job_hopper'):
        count = job_hopping.get('short_tenure_count', 0)
        flags.append({
            'category': 'career',
            'severity': 'warning',
            'message': f'Frequent role changes: {count} positions with < 12 months tenure in last 5 years.',
        })

    # Employment gaps
    for gap in employment_gaps:
        severity = 'critical' if gap['gap_months'] > 18 else 'warning'
        flags.append({
            'category': 'career',
            'severity': severity,
            'message': f'Employment gap of {gap["gap_months"]} months ({gap["between"]}).',
        })

    # Ambiguous experience
    if experience_result.get('is_ambiguous'):
        flags.append({
            'category': 'career',
            'severity': 'warning',
            'message': 'Experience calculation is ambiguous — dates could not be fully parsed.',
        })

    # Very few work entries for claimed experience
    work_entries = parsed_data.get('work_entries', [])
    total_years = experience_result.get('total_years', 0)
    if total_years > 5 and len(work_entries) <= 1:
        flags.append({
            'category': 'career',
            'severity': 'warning',
            'message': f'Claims {total_years} years experience but only {len(work_entries)} work entry detected.',
        })


def _check_resume_flags(flags, quality, sections, parsed_data):
    """Resume formatting and content red flags."""

    # Skill stuffing
    for flag in quality.get('flags', []):
        if 'skill stuffing' in flag.lower():
            flags.append({
                'category': 'resume',
                'severity': 'warning',
                'message': flag,
            })

    # Missing contact info
    if not quality.get('has_email'):
        flags.append({
            'category': 'resume',
            'severity': 'warning',
            'message': 'No email address detected in resume.',
        })

    if not quality.get('has_phone'):
        flags.append({
            'category': 'resume',
            'severity': 'info',
            'message': 'No phone number detected in resume.',
        })

    # Very short resume
    word_count = quality.get('word_count', 0)
    total_years = 0
    work_entries = parsed_data.get('work_entries', [])
    for entry in work_entries:
        total_years += entry.get('months', 0) / 12

    if word_count < 150 and total_years > 2:
        flags.append({
            'category': 'resume',
            'severity': 'warning',
            'message': f'Resume is only {word_count} words — unusually short for {total_years:.0f}+ years of experience.',
        })

    # Poor structure
    if sections.get('sections_found_count', 0) < 2:
        flags.append({
            'category': 'resume',
            'severity': 'warning',
            'message': 'Resume lacks standard section headers (Skills, Experience, Education).',
        })

    # No structured data extracted
    if not parsed_data.get('has_structured_data'):
        flags.append({
            'category': 'resume',
            'severity': 'info',
            'message': 'Could not extract structured work or education entries from resume.',
        })


def _check_consistency_flags(flags, experience_result, skill_result, parsed_data):
    """Consistency between claims and evidence."""

    work_entries = parsed_data.get('work_entries', [])

    # Experience claimed vs dates
    total_years = experience_result.get('total_years', 0)
    if work_entries:
        # Get earliest start date from work entries
        start_years = [
            e['start_date'][0] for e in work_entries
            if e.get('start_date')
        ]
        if start_years:
            from datetime import datetime
            earliest = min(start_years)
            max_possible = datetime.now().year - earliest
            if total_years > max_possible + 1:  # Allow 1 year tolerance
                flags.append({
                    'category': 'consistency',
                    'severity': 'critical',
                    'message': (
                        f'Claims {total_years} years experience but earliest role detected '
                        f'is from {earliest} ({max_possible} years ago).'
                    ),
                })

    # Skills listed but never mentioned in experience
    matched_skills = skill_result.get('matched', [])
    skills_in_experience = 0
    skills_only_in_section = 0

    for skill_info in matched_skills:
        depth = skill_info.get('depth', {})
        in_experience = depth.get('in_experience', False) if isinstance(depth, dict) else False
        in_skills_section = depth.get('in_skills_section', False) if isinstance(depth, dict) else False

        if in_skills_section and not in_experience:
            skills_only_in_section += 1
        if in_experience:
            skills_in_experience += 1

    if skills_only_in_section > 5 and skills_in_experience < 3:
        flags.append({
            'category': 'consistency',
            'severity': 'warning',
            'message': (
                f'{skills_only_in_section} skills listed in Skills section but not demonstrated '
                f'in any work experience. Possible keyword padding.'
            ),
        })


def _check_scoring_flags(flags, final_score_data, skill_result, role_relevance, skill_recency):
    """Scoring anomaly flags."""

    score = final_score_data.get('score', 0)

    # High score but must-haves missing
    missing_must_haves = [m['name'] for m in skill_result.get('missing', []) if m.get('is_must_have')]
    if score >= 60 and missing_must_haves:
        flags.append({
            'category': 'scoring',
            'severity': 'critical',
            'message': (
                f'Score is {score} but must-have skill(s) missing: '
                f'{", ".join(missing_must_haves)}. Review recommended.'
            ),
        })

    # Score mostly from partial credit
    partial_count = len(skill_result.get('partial', []))
    direct_count = len(skill_result.get('matched', []))
    if partial_count > direct_count and partial_count >= 3:
        flags.append({
            'category': 'scoring',
            'severity': 'warning',
            'message': (
                f'Skill score is primarily from partial credit ({partial_count} partial vs '
                f'{direct_count} direct matches). Candidate may have related but not exact skills.'
            ),
        })

    # Low role relevance but high skill match
    role_score = role_relevance.get('score', 50)
    skill_pct = final_score_data.get('skill_match_pct', 50)
    if role_score < 30 and skill_pct > 60:
        flags.append({
            'category': 'scoring',
            'severity': 'warning',
            'message': (
                f'High skill match ({skill_pct:.0f}%) but low role relevance ({role_score}%). '
                f'Candidate has the skills but from a different domain.'
            ),
        })

    # Low recency
    recency_score = skill_recency.get('score', 50)
    if recency_score < 50 and score >= 50:
        flags.append({
            'category': 'scoring',
            'severity': 'info',
            'message': (
                f'Skills are not recently used (recency score: {recency_score}%). '
                f'Some matched skills may be outdated.'
            ),
        })
