"""
Job Description skill extraction utility.
Scans pasted JD text against KNOWN_SKILLS to detect tech skills.
"""
import re
from analysis.skill_data import KNOWN_SKILLS, SKILL_SYNONYMS, get_canonical_name


def extract_skills_from_text(description_text):
    """
    Scan a job description and return detected skill names.
    Uses word boundary matching to avoid false positives.
    Returns: list of unique canonical skill names found.
    """
    if not description_text:
        return []

    text_lower = description_text.lower()
    found_skills = set()

    # Check all known skills using word boundary regex
    for skill in KNOWN_SKILLS:
        if len(skill) <= 1:
            continue  # Skip single-char skills to avoid noise

        # Handle special characters
        if any(c in skill for c in '#.+'):
            if skill in text_lower:
                canonical = get_canonical_name(skill)
                found_skills.add(canonical)
        else:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower, re.IGNORECASE):
                canonical = get_canonical_name(skill)
                found_skills.add(canonical)

    # Return sorted list of canonical names with proper casing
    # Use the original key casing from SKILL_SYNONYMS
    casing_map = {k.lower(): k for k in SKILL_SYNONYMS.keys()}
    result = []
    for skill in sorted(found_skills):
        proper_name = casing_map.get(skill, skill.title())
        result.append(proper_name)

    return result
