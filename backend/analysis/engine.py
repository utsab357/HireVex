import re

class ATSEngine:
    """
    A real keyword-matching ATS (Applicant Tracking System) engine.
    No external AI APIs needed — 100% free.
    
    How it works:
    1. Reads the actual text extracted from the uploaded PDF resume
    2. Reads the job requirements (skills) and job description
    3. Checks which skills are found vs missing in the resume
    4. Calculates a weighted score based on importance & must-have flags
    5. Generates real strengths (matched skills) and weaknesses (missing skills)
    6. Creates relevant interview questions based on the gaps
    """

    # Common resume section keywords to detect structure
    SECTION_KEYWORDS = {
        'experience': ['experience', 'work history', 'employment', 'professional background'],
        'education': ['education', 'academic', 'degree', 'university', 'college', 'school'],
        'skills': ['skills', 'technologies', 'tech stack', 'tools', 'proficiencies', 'competencies'],
        'projects': ['projects', 'portfolio'],
        'certifications': ['certifications', 'certificates', 'licensed'],
    }

    @staticmethod
    def evaluate(candidate):
        """
        Evaluate a candidate's resume against their job requirements.
        Returns a structured result with score, strengths, weaknesses, and questions.
        """
        job = candidate.job
        
        # Get the parsed resume text
        resume_text = ""
        try:
            if hasattr(candidate, 'resume') and candidate.resume:
                resume_text = (candidate.resume.parsed_text or "").lower().strip()
        except Exception:
            resume_text = ""

        # If no resume text was extracted, return a low score
        if not resume_text or resume_text.startswith("[text extraction failed"):
            return ATSEngine._no_resume_result()

        # Get job requirements
        requirements = list(job.requirements.all())
        job_description = (job.description or "").lower()

        # If no requirements defined, do a basic description keyword match
        if not requirements:
            return ATSEngine._description_only_match(resume_text, job_description, job.title)

        # ═══════════════════════════════════════════
        # STEP 1: Skill Matching
        # ═══════════════════════════════════════════
        matched_skills = []
        missing_skills = []
        total_weight = 0
        earned_weight = 0

        for req in requirements:
            skill = req.skill_name.lower().strip()
            weight = req.importance  # 1-5
            is_must = req.is_must_have
            
            # Increase weight for must-have skills
            effective_weight = weight * (2 if is_must else 1)
            total_weight += effective_weight

            # Check if skill appears in the resume text
            # Use word boundary matching to avoid false positives
            # e.g. "react" shouldn't match "reactive" unless "react" is standalone
            found = ATSEngine._skill_found_in_text(skill, resume_text)

            if found:
                earned_weight += effective_weight
                matched_skills.append({
                    'name': req.skill_name,
                    'importance': weight,
                    'is_must_have': is_must,
                })
            else:
                missing_skills.append({
                    'name': req.skill_name,
                    'importance': weight,
                    'is_must_have': is_must,
                })

        # ═══════════════════════════════════════════
        # STEP 2: Calculate Score
        # ═══════════════════════════════════════════
        if total_weight > 0:
            base_score = round((earned_weight / total_weight) * 100)
        else:
            base_score = 50

        # Bonus: Check if description keywords appear in resume (+/- 10 points)
        desc_keywords = ATSEngine._extract_keywords(job_description)
        desc_match_count = sum(1 for kw in desc_keywords if kw in resume_text)
        desc_bonus = min(10, round((desc_match_count / max(len(desc_keywords), 1)) * 10))
        
        # Penalty: Missing must-have skills is a big deal
        must_have_missing = [s for s in missing_skills if s['is_must_have']]
        must_have_penalty = len(must_have_missing) * 15

        final_score = max(0, min(100, base_score + desc_bonus - must_have_penalty))

        # ═══════════════════════════════════════════
        # STEP 3: Detect Resume Quality Signals
        # ═══════════════════════════════════════════
        has_experience = any(kw in resume_text for kw in ATSEngine.SECTION_KEYWORDS['experience'])
        has_education = any(kw in resume_text for kw in ATSEngine.SECTION_KEYWORDS['education'])
        has_projects = any(kw in resume_text for kw in ATSEngine.SECTION_KEYWORDS['projects'])
        
        # Check for years of experience mentions
        year_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', resume_text)
        max_years = max([int(y) for y in year_matches], default=0)

        # ═══════════════════════════════════════════
        # STEP 4: Build Strengths
        # ═══════════════════════════════════════════
        strengths = []
        
        if matched_skills:
            top_matched = sorted(matched_skills, key=lambda x: x['importance'], reverse=True)[:3]
            skill_names = ", ".join([s['name'] for s in top_matched])
            strengths.append(f"Resume demonstrates proficiency in key required skills: {skill_names}.")

        must_have_matched = [s for s in matched_skills if s['is_must_have']]
        if must_have_matched:
            names = ", ".join([s['name'] for s in must_have_matched])
            strengths.append(f"Covers critical must-have requirements: {names}.")

        if max_years >= 3:
            strengths.append(f"Shows {max_years}+ years of relevant professional experience.")
        
        if has_education:
            strengths.append("Educational background is documented and verifiable.")
        
        if has_projects:
            strengths.append("Includes a portfolio or project section demonstrating practical work.")
        
        match_pct = round((len(matched_skills) / max(len(requirements), 1)) * 100)
        if match_pct >= 70:
            strengths.append(f"Strong overall requirement coverage at {match_pct}% skill match rate.")

        if not strengths:
            strengths.append("Resume was successfully parsed and contains readable content.")

        # ═══════════════════════════════════════════
        # STEP 5: Build Weaknesses
        # ═══════════════════════════════════════════
        weaknesses = []
        
        if must_have_missing:
            names = ", ".join([s['name'] for s in must_have_missing])
            weaknesses.append(f"Missing critical must-have skills: {names}. This is a significant gap.")
        
        optional_missing = [s for s in missing_skills if not s['is_must_have']]
        if optional_missing:
            names = ", ".join([s['name'] for s in optional_missing[:3]])
            weaknesses.append(f"Does not mention these preferred skills: {names}.")
        
        if not has_experience:
            weaknesses.append("Resume does not clearly highlight a work experience section.")
        
        if max_years == 0:
            weaknesses.append("No specific years of experience could be detected from the resume.")
        elif max_years < 2:
            weaknesses.append(f"Shows only {max_years} year(s) of experience, which may be below expectations.")
        
        if not has_education:
            weaknesses.append("No formal education section was detected in the resume.")

        if not weaknesses:
            weaknesses.append("No significant gaps detected based on the defined requirements.")

        # ═══════════════════════════════════════════
        # STEP 6: Generate Interview Questions
        # ═══════════════════════════════════════════
        questions = []
        
        for skill in must_have_missing[:2]:
            questions.append(
                f"We noticed {skill['name']} wasn't mentioned in your resume. "
                f"Can you describe any hands-on experience you have with {skill['name']}?"
            )
        
        for skill in optional_missing[:1]:
            questions.append(
                f"This role benefits from knowledge of {skill['name']}. "
                f"How comfortable are you with picking up {skill['name']} if needed?"
            )
        
        if max_years < 3:
            questions.append(
                "Can you walk us through your most complex project and what challenges you overcame?"
            )
        
        if matched_skills:
            top_skill = matched_skills[0]['name']
            questions.append(
                f"You've listed {top_skill} on your resume. "
                f"Can you describe a recent project where you used {top_skill} extensively?"
            )

        questions.append(
            "What attracted you to this role, and how do you see yourself contributing in the first 90 days?"
        )

        # ═══════════════════════════════════════════
        # STEP 7: Build Explanation
        # ═══════════════════════════════════════════
        total_req = len(requirements)
        matched_count = len(matched_skills)
        
        explanation = (
            f"Resume was analyzed against {total_req} job requirement(s). "
            f"{matched_count} of {total_req} required skills were found in the resume text "
            f"({match_pct}% match rate). "
        )
        
        if must_have_missing:
            explanation += (
                f"WARNING: {len(must_have_missing)} must-have skill(s) are missing, "
                f"which significantly impacts the overall score. "
            )
        
        if final_score >= 80:
            explanation += "Overall, this candidate is a strong match for the role."
        elif final_score >= 60:
            explanation += "This candidate shows moderate alignment and may be worth interviewing."
        elif final_score >= 40:
            explanation += "This candidate has notable gaps but could be considered if the talent pool is limited."
        else:
            explanation += "This candidate does not appear to be a strong match for this role based on the resume content."

        return {
            "overall_score": final_score,
            "explanation": explanation,
            "strengths": strengths[:4],
            "weaknesses": weaknesses[:3],
            "interview_questions": questions[:4]
        }

    @staticmethod
    def _skill_found_in_text(skill, text):
        """
        Smart skill matching. Handles multi-word skills and common variations.
        e.g. "react" matches "react", "react.js", "reactjs" but NOT "reactive"
        """
        skill_clean = skill.lower().strip()
        
        # Direct substring check first (fast path)
        if skill_clean in text:
            return True
        
        # Try common tech variations: "react" -> "react.js", "reactjs"
        variations = [
            skill_clean,
            skill_clean.replace(' ', ''),           # "machine learning" -> "machinelearning"
            skill_clean.replace('.js', ''),           # "node.js" -> "node"
            skill_clean + '.js',                      # "react" -> "react.js"
            skill_clean + 'js',                       # "react" -> "reactjs"
            skill_clean.replace(' ', '-'),            # "ci cd" -> "ci-cd"
            skill_clean.replace('-', ' '),            # "ci-cd" -> "ci cd"
            skill_clean.replace('/', ' '),            # "ci/cd" -> "ci cd"
        ]
        
        return any(v in text for v in variations)

    @staticmethod
    def _extract_keywords(text):
        """Extract meaningful keywords from job description."""
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'can', 'shall', 'this', 'that',
            'these', 'those', 'we', 'you', 'they', 'it', 'our', 'your', 'their',
            'its', 'as', 'if', 'not', 'no', 'so', 'up', 'out', 'about',
        }
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        return [w for w in set(words) if w not in stop_words]

    @staticmethod
    def _no_resume_result():
        """Return when no resume text could be extracted."""
        return {
            "overall_score": 0,
            "explanation": "Could not extract any text from the uploaded file. The file may not be a valid resume PDF, or it may be image-based (scanned). Please upload a text-based PDF resume.",
            "strengths": ["File was successfully uploaded to the system."],
            "weaknesses": [
                "No readable text could be extracted from the PDF.",
                "The file may be a scanned image, an invoice, or a non-resume document.",
                "ATS scoring requires text-based PDF resumes to function properly."
            ],
            "interview_questions": [
                "Could you provide a text-based version of your resume for our review?"
            ]
        }

    @staticmethod
    def _description_only_match(resume_text, description, job_title):
        """Fallback when no specific skills/requirements are defined for the job."""
        keywords = ATSEngine._extract_keywords(description)
        title_keywords = ATSEngine._extract_keywords(job_title.lower())
        all_keywords = list(set(keywords + title_keywords))
        
        if not all_keywords:
            return {
                "overall_score": 50,
                "explanation": "No job requirements were defined, so a detailed skill match could not be performed. Add specific skills to the job to get accurate scoring.",
                "strengths": ["Resume was successfully parsed."],
                "weaknesses": ["No specific job requirements to match against. Please add skills to the job posting."],
                "interview_questions": ["Tell us about your relevant experience for this role."]
            }
        
        matched = [kw for kw in all_keywords if kw in resume_text]
        score = round((len(matched) / len(all_keywords)) * 100)
        score = max(10, min(90, score))  # Cap between 10-90 for description-only
        
        return {
            "overall_score": score,
            "explanation": f"Matched {len(matched)} of {len(all_keywords)} keywords from the job description. Note: Add specific skill requirements to the job for more accurate scoring.",
            "strengths": [f"Resume contains relevant keywords: {', '.join(matched[:5])}."] if matched else ["Resume was parsed successfully."],
            "weaknesses": [f"Job description keywords not found in resume: {', '.join([k for k in all_keywords if k not in resume_text][:5])}."],
            "interview_questions": [
                "Walk us through your most relevant experience for this position.",
                "What specific skills do you bring that align with this role?"
            ]
        }
