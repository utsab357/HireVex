"""
Teach-Time Estimator — Estimates learning effort for missing skills.
Based on prerequisite coverage and skill group membership.

NO AI/ML — Pure rule-based estimation.
"""

from analysis.skill_data import SKILL_PREREQUISITES, get_skill_group, get_canonical_name


def estimate_teach_time(missing_skills, matched_skill_names):
    """
    For each missing skill, estimate how long it would take the candidate
    to learn it based on their existing skills.

    Args:
        missing_skills: list of {'name': str, 'is_must_have': bool}
        matched_skill_names: list of str (canonical names of matched skills)

    Returns: list of {
        'skill': str,
        'is_must_have': bool,
        'effort_level': str ('low', 'medium', 'high'),
        'estimated_weeks': int,
        'reason': str,
        'prerequisites_met': list of str,
        'prerequisites_missing': list of str,
    }
    """
    # Normalize matched skills for lookup
    matched_lower = set(s.lower() for s in matched_skill_names)

    results = []

    for skill_info in missing_skills:
        skill_name = skill_info.get('name', '')
        skill_lower = skill_name.lower()
        canonical = get_canonical_name(skill_lower)

        prereqs = SKILL_PREREQUISITES.get(canonical, SKILL_PREREQUISITES.get(skill_lower, []))

        prereqs_met = [p for p in prereqs if get_canonical_name(p.lower()) in matched_lower or p.lower() in matched_lower]
        prereqs_missing = [p for p in prereqs if p not in prereqs_met]

        # Check if candidate has a skill in the same group
        skill_group = get_skill_group(canonical)
        has_group_skill = False
        if skill_group:
            for matched in matched_lower:
                if get_skill_group(matched) == skill_group:
                    has_group_skill = True
                    break

        # Determine effort level
        if prereqs:
            prereq_coverage = len(prereqs_met) / len(prereqs)
        else:
            prereq_coverage = 0

        if has_group_skill and prereq_coverage >= 0.8:
            # Has related framework + prerequisites → very easy
            effort = 'low'
            weeks = 2
            reason = f'Has related technology in same group and {len(prereqs_met)}/{len(prereqs)} prerequisites.'
        elif has_group_skill:
            # Has related framework → moderate
            effort = 'low'
            weeks = 3
            reason = f'Has related technology in same group ({skill_group}).'
        elif prereq_coverage >= 1.0:
            # Has ALL prerequisites → moderate (just needs to learn the framework)
            effort = 'low'
            weeks = 3
            reason = f'Has all prerequisites: {", ".join(prereqs_met)}.'
        elif prereq_coverage >= 0.5:
            # Has some prerequisites
            effort = 'medium'
            weeks = 6
            reason = f'Has {len(prereqs_met)}/{len(prereqs)} prerequisites. Missing: {", ".join(prereqs_missing)}.'
        elif prereqs and prereq_coverage > 0:
            # Has few prerequisites
            effort = 'medium'
            weeks = 8
            reason = f'Has some foundation ({", ".join(prereqs_met)}) but missing key prerequisites.'
        else:
            # No related skills at all
            effort = 'high'
            weeks = 12
            if prereqs:
                reason = f'No prerequisites found. Would need to learn: {", ".join(prereqs)}.'
            else:
                reason = 'No related skills or prerequisites detected.'

        results.append({
            'skill': skill_name,
            'is_must_have': skill_info.get('is_must_have', False),
            'effort_level': effort,
            'estimated_weeks': weeks,
            'reason': reason,
            'prerequisites_met': prereqs_met,
            'prerequisites_missing': prereqs_missing,
        })

    return results
