"""
Resume Parser — Structured Data Extraction Module
Extracts individual work entries, education entries, and certifications
from raw resume text using rule-based pattern matching.

NO AI/ML — Pure regex + heuristic extraction.
"""

import re
from datetime import datetime
from analysis.cert_data import get_all_cert_patterns


# ═══════════════════════════════════════════════════════════
# WORK ENTRY EXTRACTION (Task 3.2)
# ═══════════════════════════════════════════════════════════

# Common date patterns used in resumes
DATE_RANGE_RE = re.compile(
    r'('
    # "Jan 2020 - Dec 2022" or "January 2020 – Present"
    r'[A-Za-z]+\.?\s*\d{4}\s*[-–—]+\s*(?:[A-Za-z]+\.?\s*\d{4}|[Pp]resent|[Cc]urrent|[Tt]ill\s*[Dd]ate|[Oo]ngoing|[Nn]ow|[Tt]oday)'
    r'|'
    # "01/2020 - 12/2022"
    r'\d{1,2}\s*[/\-]\s*\d{4}\s*[-–—]+\s*(?:\d{1,2}\s*[/\-]\s*\d{4}|[Pp]resent|[Cc]urrent|[Tt]ill\s*[Dd]ate|[Oo]ngoing|[Nn]ow|[Tt]oday)'
    r'|'
    # "2019 - 2022" or "2020 - Present"
    r'\b\d{4}\s*[-–—]+\s*(?:\d{4}|[Pp]resent|[Cc]urrent|[Tt]ill\s*[Dd]ate|[Oo]ngoing|[Nn]ow|[Tt]oday)'
    r')',
    re.IGNORECASE
)

# Common job title patterns
TITLE_INDICATORS = [
    'engineer', 'developer', 'manager', 'analyst', 'designer',
    'architect', 'lead', 'director', 'consultant', 'specialist',
    'coordinator', 'administrator', 'scientist', 'associate',
    'intern', 'trainee', 'executive', 'officer', 'head',
    'vp', 'vice president', 'founder', 'co-founder', 'cto', 'ceo',
    'full stack', 'frontend', 'backend', 'devops', 'qa', 'sre',
    'product owner', 'scrum master', 'project manager',
    'data engineer', 'data analyst', 'data scientist',
    'software', 'senior', 'junior', 'principal', 'staff',
]

# Internship indicators
INTERNSHIP_INDICATORS = ['intern', 'internship', 'trainee', 'apprentice', 'co-op']

# Education indicators (to EXCLUDE from work entries)
EDUCATION_INDICATORS = [
    'b.tech', 'btech', 'm.tech', 'mtech', 'bachelor', 'master',
    'b.sc', 'bsc', 'm.sc', 'msc', 'b.e.', 'b.e', 'm.e.',
    'mba', 'phd', 'ph.d', 'degree', 'diploma', 'university',
    'college', 'campus', 'cgpa', 'gpa', 'institute',
    'school', 'academic', 'class of', 'graduated',
    'higher secondary', '10th', '12th', 'hsc', 'ssc',
]


def _parse_single_date(date_str):
    """Parse a single date string into (year, month) tuple."""
    date_str = date_str.strip().lower()

    # Handle "present", "current", etc.
    if any(w in date_str for w in ['present', 'current', 'till date', 'ongoing', 'now', 'today']):
        now = datetime.now()
        return (now.year, now.month)

    # Try "Month Year" — "Jan 2020", "January 2020"
    month_names = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'june': 6, 'july': 7, 'august': 8, 'september': 9,
        'october': 10, 'november': 11, 'december': 12,
    }

    for month_name, month_num in month_names.items():
        if month_name in date_str:
            year_match = re.search(r'\d{4}', date_str)
            if year_match:
                return (int(year_match.group()), month_num)

    # Try "MM/YYYY" or "MM-YYYY"
    mm_yyyy = re.match(r'(\d{1,2})\s*[/\-]\s*(\d{4})', date_str)
    if mm_yyyy:
        return (int(mm_yyyy.group(2)), int(mm_yyyy.group(1)))

    # Try just "YYYY"
    year_only = re.match(r'^(\d{4})$', date_str.strip())
    if year_only:
        return (int(year_only.group(1)), 1)

    return None


def extract_work_entries(experience_section_text):
    """
    Task 3.2: Extract individual work entries from the experience section.

    Each entry is parsed into:
    {
        'title': str,          # Job title (best guess)
        'company': str,        # Company name (best guess)
        'start_date': tuple,   # (year, month) or None
        'end_date': tuple,     # (year, month) or None
        'months': int,         # Duration in months
        'is_current': bool,    # Currently working here
        'is_internship': bool, # Detected as internship
        'bullets': list,       # Bullet point lines
        'raw_text': str,       # Original text block
    }
    """
    if not experience_section_text or not experience_section_text.strip():
        return []

    lines = experience_section_text.split('\n')
    entries = []
    current_entry = None

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue

        # Check if this line contains a date range (signals a new work entry)
        date_match = DATE_RANGE_RE.search(stripped)

        if date_match:
            # Save previous entry
            if current_entry:
                entries.append(current_entry)

            # Parse the date range
            date_range_str = date_match.group(0)
            parts = re.split(r'\s*[-–—]+\s*', date_range_str, maxsplit=1)

            start_date = _parse_single_date(parts[0]) if len(parts) > 0 else None
            end_date = _parse_single_date(parts[1]) if len(parts) > 1 else None

            # Calculate months
            months = 0
            is_current = False
            if start_date and end_date:
                months = (end_date[0] - start_date[0]) * 12 + (end_date[1] - start_date[1])
                months = max(0, months)
                # Check if current
                now = datetime.now()
                if end_date == (now.year, now.month):
                    is_current = True

            # Extract title and company from the non-date part of the line
            # and potentially the line before/after
            text_without_date = stripped[:date_match.start()] + stripped[date_match.end():]
            text_without_date = re.sub(r'[|•·,\-–—]+$', '', text_without_date).strip()
            text_without_date = re.sub(r'^[|•·,\-–—]+', '', text_without_date).strip()

            title, company = _extract_title_company(text_without_date, lines, i)

            # Check if internship
            context = stripped.lower()
            if i > 0:
                context += ' ' + lines[i - 1].lower()
            is_internship = any(ind in context for ind in INTERNSHIP_INDICATORS)

            # Check if this is actually education (skip if so)
            is_education = any(ind in context for ind in EDUCATION_INDICATORS)
            if is_education:
                current_entry = None
                continue

            current_entry = {
                'title': title,
                'company': company,
                'start_date': start_date,
                'end_date': end_date,
                'months': months,
                'is_current': is_current,
                'is_internship': is_internship,
                'bullets': [],
                'raw_text': stripped,
            }

        elif current_entry is not None:
            # This line belongs to the current entry (bullet point)
            bullet = stripped.lstrip('•·-–—*▪▸►◆○● ')
            if bullet and len(bullet) > 5:  # Skip very short lines
                current_entry['bullets'].append(bullet)

    # Don't forget the last entry
    if current_entry:
        entries.append(current_entry)

    return entries


def _extract_title_company(text, all_lines, current_line_idx):
    """
    Attempt to extract job title and company name from text near a date range.
    Uses heuristics — not perfect, but handles common resume formats.
    """
    title = ''
    company = ''

    if not text:
        # Try the line above the date line
        if current_line_idx > 0:
            text = all_lines[current_line_idx - 1].strip()

    if not text:
        return title, company

    # Common separators: "Title at Company", "Title — Company", "Title | Company"
    separators = [' at ', ' @ ', ' — ', ' - ', ' | ', ', ']
    for sep in separators:
        if sep in text:
            parts = text.split(sep, 1)
            # Heuristic: title usually comes first
            candidate_title = parts[0].strip()
            candidate_company = parts[1].strip()

            # Check which part looks more like a title
            title_score = sum(1 for ind in TITLE_INDICATORS if ind in candidate_title.lower())
            company_score = sum(1 for ind in TITLE_INDICATORS if ind in candidate_company.lower())

            if title_score >= company_score:
                title = candidate_title
                company = candidate_company
            else:
                title = candidate_company
                company = candidate_title
            return title, company

    # No separator found — check if the whole text looks like a title
    text_lower = text.lower()
    has_title_word = any(ind in text_lower for ind in TITLE_INDICATORS)
    if has_title_word:
        title = text
        # Try line before for company
        if current_line_idx > 0:
            prev = all_lines[current_line_idx - 1].strip()
            if prev and not DATE_RANGE_RE.search(prev):
                company = prev
    else:
        company = text
        # Try line before for title
        if current_line_idx > 0:
            prev = all_lines[current_line_idx - 1].strip()
            if prev and not DATE_RANGE_RE.search(prev):
                title = prev

    return title, company


# ═══════════════════════════════════════════════════════════
# EDUCATION ENTRY EXTRACTION (Task 3.3)
# ═══════════════════════════════════════════════════════════

DEGREE_PATTERNS = {
    'phd': [r'\bph\.?d\b', r'\bdoctorate\b', r'\bdoctor of philosophy\b'],
    'masters': [r'\bm\.?s\.?\b', r'\bm\.?sc\b', r'\bm\.?tech\b', r'\bmaster', r'\bmba\b', r'\bm\.?eng\b'],
    'bachelors': [r'\bb\.?s\.?\b', r'\bb\.?sc\b', r'\bb\.?tech\b', r'\bbachelor', r'\bb\.?eng\b', r'\bb\.?a\b', r'\bb\.?com\b', r'\bbca\b', r'\bbba\b'],
    'diploma': [r'\bdiploma\b', r'\bassociate degree\b', r'\bassociates?\b'],
}


def extract_education_entries(education_section_text):
    """
    Task 3.3: Extract individual education entries.

    Each entry returns:
    {
        'degree': str,        # e.g., 'bachelors', 'masters', 'phd'
        'field': str,         # e.g., 'Computer Science'
        'institution': str,   # e.g., 'MIT'
        'year': int or None,  # Graduation year
        'is_current': bool,
        'raw_text': str,
    }
    """
    if not education_section_text or not education_section_text.strip():
        return []

    lines = education_section_text.split('\n')
    entries = []

    # Process in blocks — each degree pattern starts a new entry
    current_entry = None

    for line in lines:
        stripped = line.strip()
        if not stripped or len(stripped) < 3:
            continue

        line_lower = stripped.lower()

        # Check if this line mentions a degree
        detected_degree = None
        for level, patterns in DEGREE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, line_lower, re.IGNORECASE):
                    detected_degree = level
                    break
            if detected_degree:
                break

        if detected_degree:
            # Save previous entry
            if current_entry:
                entries.append(current_entry)

            # Extract year
            year_match = re.search(r'\b(19|20)\d{2}\b', stripped)
            year = int(year_match.group()) if year_match else None

            # Check if current
            is_current = any(w in line_lower for w in ['present', 'current', 'ongoing', 'pursuing', 'expected'])

            # Extract field of study
            field = _extract_field_of_study(stripped)

            # Extract institution (heuristic: look for "University", "College", "Institute")
            institution = _extract_institution(stripped, lines)

            current_entry = {
                'degree': detected_degree,
                'field': field,
                'institution': institution,
                'year': year,
                'is_current': is_current,
                'raw_text': stripped,
            }

        elif current_entry:
            # Check if this line contains institution info
            if any(w in line_lower for w in ['university', 'college', 'institute', 'school', 'academy']):
                if not current_entry['institution']:
                    current_entry['institution'] = stripped.strip('•·-–—*| ')

    # Don't forget last entry
    if current_entry:
        entries.append(current_entry)

    return entries


def _extract_field_of_study(text):
    """Extract field of study from education line."""
    # Common patterns: "B.Tech in Computer Science", "BS Computer Science", "Bachelor of Science in ..."
    field_patterns = [
        r'(?:in|of)\s+([A-Za-z\s&]+?)(?:\s*[-–—|,\(\)]|\s*\d{4}|$)',
        r'(?:b\.?tech|m\.?tech|b\.?s|m\.?s|bsc|msc|bachelor|master)\s+([A-Za-z\s&]+?)(?:\s*[-–—|,\(\)]|\s*\d{4}|$)',
    ]
    for pattern in field_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            field = match.group(1).strip()
            # Clean up common suffixes
            field = re.sub(r'\s+(from|at|university|college|institute).*$', '', field, flags=re.IGNORECASE)
            if 3 < len(field) < 60:
                return field
    return ''


def _extract_institution(text, all_lines=None):
    """Extract institution name from text."""
    institution_indicators = ['university', 'college', 'institute', 'school', 'academy', 'iit', 'nit', 'bits']

    # Check current line
    for indicator in institution_indicators:
        if indicator in text.lower():
            # Try to extract the full institution name
            # Look for pattern: "at/from Institution Name" or "Institution Name"
            at_match = re.search(r'(?:at|from)\s+(.+?)(?:\s*[-–—|,]|\s*\d{4}|$)', text, re.IGNORECASE)
            if at_match:
                return at_match.group(1).strip()
            # Fallback: return the part containing the indicator
            return text.strip()

    return ''


# ═══════════════════════════════════════════════════════════
# CERTIFICATION EXTRACTION (Task 3.4)
# ═══════════════════════════════════════════════════════════

def extract_certifications(certifications_section_text, full_resume_text=''):
    """
    Task 3.4: Extract certifications from resume.

    Checks the certifications section first, then scans full text as fallback.

    Each entry returns:
    {
        'name': str,              # Canonical certification name
        'matched_text': str,      # The actual text that matched
        'issuer': str,            # Issuing organization (if detected)
        'year': int or None,      # Year obtained
    }
    """
    cert_patterns = get_all_cert_patterns()
    found = []
    found_canonicals = set()  # Prevent duplicates

    # Search text — prefer certifications section, but also check full text
    search_texts = []
    if certifications_section_text and certifications_section_text.strip():
        search_texts.append(certifications_section_text)
    if full_resume_text and full_resume_text.strip():
        search_texts.append(full_resume_text)

    for text in search_texts:
        text_lower = text.lower()

        for pattern, canonical in cert_patterns:
            if canonical in found_canonicals:
                continue  # Already found this cert

            # Use word boundary matching for short patterns
            if len(pattern) <= 4:
                regex = r'\b' + re.escape(pattern) + r'\b'
                match = re.search(regex, text_lower)
            else:
                match = re.search(re.escape(pattern), text_lower)

            if match:
                found_canonicals.add(canonical)

                # Try to find year near the match
                context_start = max(0, match.start() - 50)
                context_end = min(len(text), match.end() + 50)
                context = text[context_start:context_end]
                year_match = re.search(r'\b(20\d{2})\b', context)
                year = int(year_match.group()) if year_match else None

                # Try to find issuer
                issuer = _detect_issuer(context)

                found.append({
                    'name': canonical,
                    'matched_text': match.group(),
                    'issuer': issuer,
                    'year': year,
                })

    return found


def _detect_issuer(context):
    """Detect certification issuer from nearby text."""
    issuers = {
        'amazon': 'Amazon Web Services',
        'aws': 'Amazon Web Services',
        'microsoft': 'Microsoft',
        'azure': 'Microsoft',
        'google': 'Google',
        'gcp': 'Google',
        'cisco': 'Cisco',
        'comptia': 'CompTIA',
        'oracle': 'Oracle',
        'scrum.org': 'Scrum.org',
        'scrum alliance': 'Scrum Alliance',
        'pmi': 'PMI',
        'hashicorp': 'HashiCorp',
        'linux foundation': 'Linux Foundation',
        'mongodb': 'MongoDB',
    }

    context_lower = context.lower()
    for keyword, issuer_name in issuers.items():
        if keyword in context_lower:
            return issuer_name
    return ''


# ═══════════════════════════════════════════════════════════
# MAIN PARSE FUNCTION (Task 3.1)
# ═══════════════════════════════════════════════════════════

def parse_resume_structured(full_text, sections):
    """
    Main entry point — extracts all structured data from resume text.

    Args:
        full_text: Raw resume text
        sections: Section detection result from ATSEngine._detect_sections()

    Returns:
    {
        'work_entries': list of work entry dicts,
        'education_entries': list of education entry dicts,
        'certifications': list of certification dicts,
        'work_entry_count': int,
        'total_work_months': int,
        'has_structured_data': bool,
    }
    """
    from analysis.engine import ATSEngine

    # Get section texts
    experience_text = ATSEngine._get_section_text(full_text, sections, 'experience')
    education_text = ATSEngine._get_section_text(full_text, sections, 'education')
    cert_text = ATSEngine._get_section_text(full_text, sections, 'certifications')

    # Extract structured entries
    work_entries = extract_work_entries(experience_text)
    education_entries = extract_education_entries(education_text)
    certifications = extract_certifications(cert_text, full_text)

    # Calculate totals
    total_work_months = sum(e.get('months', 0) for e in work_entries)

    return {
        'work_entries': work_entries,
        'education_entries': education_entries,
        'certifications': certifications,
        'work_entry_count': len(work_entries),
        'total_work_months': total_work_months,
        'has_structured_data': len(work_entries) > 0 or len(education_entries) > 0,
    }
